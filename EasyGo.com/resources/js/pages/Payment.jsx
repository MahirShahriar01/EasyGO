import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/client';
import { ErrorState, Spinner } from '../components/common/Feedback';
import useApi from '../hooks/useApi';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { money } from '../utils/format';
import { PriceSummary, Stepper } from './Checkout';

const METHODS = [
    { key: 'card', label: 'Credit / debit card', icon: 'mdi-credit-card-outline', hint: 'Visa, Mastercard, Amex' },
    { key: 'bkash', label: 'bKash', icon: 'mdi-cellphone', hint: 'Mobile wallet' },
    { key: 'nagad', label: 'Nagad', icon: 'mdi-cellphone-wireless', hint: 'Mobile wallet' },
    { key: 'rocket', label: 'Rocket', icon: 'mdi-rocket-launch-outline', hint: 'Mobile wallet' },
    { key: 'pay_at_property', label: 'Pay at property', icon: 'mdi-office-building-outline', hint: 'Reserve now, pay at the hotel', hotelOnly: true },
];

/** Live countdown of the inventory hold; unpaid bookings expire afterwards. */
function HoldTimer({ createdAt, minutes }) {
    const deadline = new Date(createdAt).getTime() + minutes * 60000;
    const [left, setLeft] = useState(deadline - Date.now());
    useEffect(() => {
        const t = setInterval(() => setLeft(deadline - Date.now()), 1000);
        return () => clearInterval(t);
    }, [deadline]);
    if (left <= 0) return <div className="alert alert-danger">Your reservation hold has expired. Please start a new booking.</div>;
    const m = Math.floor(left / 60000);
    const s = Math.floor((left % 60000) / 1000);
    return (
        <div className="alert alert-warning d-flex align-items-center gap-2">
            <i className="mdi mdi-timer-sand fs-4" />
            <span>We're holding your booking for <strong className="hold-timer">{m}:{String(s).padStart(2, '0')}</strong>. Complete payment before the timer ends.</span>
        </div>
    );
}

export default function Payment() {
    useDocumentTitle('Payment');
    const { reference } = useParams();
    const navigate = useNavigate();
    const settings = useSelector((s) => s.settings);
    const { data, loading, error } = useApi(`/bookings/${reference}`);
    const [method, setMethod] = useState('card');
    const [form, setForm] = useState({ card_number: '', card_name: '', card_expiry: '', card_cvc: '', wallet_number: '', otp: '' });
    const [busy, setBusy] = useState(false);
    const [otpSent, setOtpSent] = useState(false);

    if (loading) return <Spinner className="py-5 min-vh-50" />;
    if (error) return <div className="container py-5"><ErrorState message={error} /></div>;

    const b = data.booking;
    if (!b.can_pay) {
        return (
            <div className="container py-5 text-center">
                <h4>This booking is {b.status}.</h4>
                <Link to={`/account/bookings/${b.reference}`} className="btn btn-primary mt-2">View booking</Link>
            </div>
        );
    }

    const methods = METHODS.filter((m) => !m.hotelOnly || (b.service_type === 'hotel' && settings.pay_at_property_enabled === '1'));
    const set = (k, fmt = (v) => v) => (e) => setForm({ ...form, [k]: fmt(e.target.value) });
    const wallet = ['bkash', 'nagad', 'rocket'].includes(method);

    const pay = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            const payload = { method };
            if (method === 'card') Object.assign(payload, { card_number: form.card_number, card_name: form.card_name, card_expiry: form.card_expiry, card_cvc: form.card_cvc });
            if (wallet) Object.assign(payload, { wallet_number: form.wallet_number, otp: form.otp });
            const { data: res } = await api.post(`/bookings/${b.reference}/pay`, payload);
            toast.success(res.message);
            navigate(`/booking/success/${b.reference}`, { replace: true });
        } catch (err) {
            toast.error(Object.values(err.fieldErrors || {})[0]?.[0] || err.userMessage);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="container py-4 py-lg-5">
            <Stepper step={1} />
            <div className="row g-4">
                <div className="col-lg-8">
                    <HoldTimer createdAt={b.created_at} minutes={Number(settings.booking_hold_minutes || 30)} />
                    <form className="card border-0 p-4" onSubmit={pay}>
                        <h5 className="fw-bold mb-3">Choose a payment method</h5>
                        <div className="row g-2 mb-4">
                            {methods.map((m) => (
                                <div className="col-sm-6 col-xl-4" key={m.key}>
                                    <div className={`pay-method h-100 ${method === m.key ? 'active' : ''}`} onClick={() => { setMethod(m.key); setOtpSent(false); }} role="radio" aria-checked={method === m.key} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setMethod(m.key)}>
                                        <i className={`mdi ${m.icon} fs-3 text-primary`} />
                                        <span><span className="d-block">{m.label}</span><span className="small text-soft fw-normal">{m.hint}</span></span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {method === 'card' && (
                            <div className="row g-3">
                                <div className="col-12">
                                    <label className="form-label" htmlFor="cc">Card number</label>
                                    <input id="cc" className="form-control" inputMode="numeric" autoComplete="cc-number" placeholder="4242 4242 4242 4242" required
                                        value={form.card_number} onChange={set('card_number', (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 '))} />
                                </div>
                                <div className="col-12"><label className="form-label" htmlFor="cn">Name on card</label><input id="cn" className="form-control" autoComplete="cc-name" required value={form.card_name} onChange={set('card_name')} /></div>
                                <div className="col-6"><label className="form-label" htmlFor="ce">Expiry (MM/YY)</label><input id="ce" className="form-control" placeholder="12/29" autoComplete="cc-exp" required value={form.card_expiry} onChange={set('card_expiry', (v) => v.replace(/[^\d]/g, '').slice(0, 4).replace(/(\d{2})(\d)/, '$1/$2'))} /></div>
                                <div className="col-6"><label className="form-label" htmlFor="cv">CVC</label><input id="cv" className="form-control" inputMode="numeric" autoComplete="cc-csc" required value={form.card_cvc} onChange={set('card_cvc', (v) => v.replace(/\D/g, '').slice(0, 4))} /></div>
                                <div className="col-12"><div className="alert alert-info small mb-0"><i className="mdi mdi-flask-outline" /> <strong>Demo gateway:</strong> any 16-digit card works; cards ending in <code>0002</code> are declined.</div></div>
                            </div>
                        )}

                        {wallet && (
                            <div className="row g-3">
                                <div className="col-md-7">
                                    <label className="form-label" htmlFor="wn">{methods.find((m) => m.key === method).label} account number</label>
                                    <input id="wn" className="form-control" inputMode="numeric" placeholder="01XXXXXXXXX" required value={form.wallet_number} onChange={set('wallet_number', (v) => v.replace(/\D/g, '').slice(0, 11))} />
                                </div>
                                <div className="col-md-5 d-grid align-items-end">
                                    <button type="button" className="btn btn-outline-primary mt-md-4" disabled={form.wallet_number.length !== 11} onClick={() => { setOtpSent(true); toast.info('Demo: use any 6-digit OTP (000000 fails).'); }}>
                                        {otpSent ? 'Resend OTP' : 'Send OTP'}
                                    </button>
                                </div>
                                {otpSent && (
                                    <div className="col-md-7">
                                        <label className="form-label" htmlFor="otp">Verification code</label>
                                        <input id="otp" className="form-control" inputMode="numeric" placeholder="6-digit OTP" required value={form.otp} onChange={set('otp', (v) => v.replace(/\D/g, '').slice(0, 6))} />
                                    </div>
                                )}
                            </div>
                        )}

                        {method === 'pay_at_property' && (
                            <div className="alert alert-success mb-0"><i className="mdi mdi-check-circle" /> Your room will be confirmed now. Pay <strong>{money(b.total)}</strong> at check-in. Free cancellation rules still apply.</div>
                        )}

                        <button className="btn btn-gradient btn-lg mt-4" disabled={busy || (wallet && !otpSent)}>
                            {busy ? <><span className="spinner-border spinner-border-sm me-2" />Processing…</> : method === 'pay_at_property' ? 'Confirm reservation' : <><i className="mdi mdi-lock" /> Pay {money(b.total)}</>}
                        </button>
                    </form>
                </div>
                <div className="col-lg-4">
                    <div className="summary-sticky">
                        <div className="card border-0 p-4 mb-3">
                            <div className="small text-soft">Booking reference</div>
                            <div className="fs-5 fw-800">{b.reference}</div>
                            <div className="fw-semibold mt-2">{b.item_name}</div>
                        </div>
                        <PriceSummary q={b} />
                    </div>
                </div>
            </div>
        </div>
    );
}
