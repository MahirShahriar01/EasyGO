import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import AdSlot from '../components/ads/AdSlot';
import api, { fieldError } from '../api/client';
import { ErrorState, Spinner } from '../components/common/Feedback';
import Img from '../components/common/Img';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { date, dateTime, money, SERVICE_ICON } from '../utils/format';

export function Stepper({ step }) {
    return (
        <div className="stepper mb-4">
            {['Your details', 'Payment', 'Confirmation'].map((label, i) => (
                <div key={label} className={`step ${i < step ? 'done' : ''} ${i === step ? 'active' : ''}`}>
                    <span className="num">{i < step ? <i className="mdi mdi-check" /> : i + 1}</span><span className="d-none d-sm-inline">{label}</span>
                </div>
            ))}
        </div>
    );
}

/** Price breakdown card shared by checkout and payment. */
export function PriceSummary({ q, children }) {
    const unitLabel = { hotel: 'night', car: 'day' }[q.service_type] ?? null;
    return (
        <div className="card border-0 p-4">
            <h6 className="fw-bold mb-3">Price details</h6>
            <div className="d-flex justify-content-between small mb-2">
                <span>{money(q.unit_price)} × {q.quantity}{unitLabel ? ` × ${q.units} ${unitLabel}${q.units > 1 ? 's' : ''}` : ''}</span>
                <span>{money(q.subtotal)}</span>
            </div>
            {q.discount > 0 && <div className="d-flex justify-content-between small mb-2 text-success"><span>Discount {q.coupon_code && <span className="badge text-bg-success">{q.coupon_code}</span>}</span><span>−{money(q.discount)}</span></div>}
            <div className="d-flex justify-content-between small mb-2"><span>Service fee</span><span>{money(q.service_fee)}</span></div>
            <div className="d-flex justify-content-between small mb-2"><span>Taxes (VAT)</span><span>{money(q.tax)}</span></div>
            <hr />
            <div className="d-flex justify-content-between fs-5 fw-800"><span>Total</span><span className="text-primary">{money(q.total)}</span></div>
            <div className="small text-soft">Includes all taxes and fees · {q.currency}</div>
            {children}
        </div>
    );
}

export default function Checkout() {
    useDocumentTitle('Checkout');
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const user = useSelector((s) => s.auth.user);

    const line = useMemo(() => ({
        service_type: params.get('service_type'),
        item_id: Number(params.get('item_id')),
        start_date: params.get('start_date') || undefined,
        end_date: params.get('end_date') || undefined,
        quantity: Number(params.get('quantity') || params.getAll('seats').length || 1),
        adults: params.get('adults') ? Number(params.get('adults')) : undefined,
        children: params.get('children') ? Number(params.get('children')) : undefined,
        seats: params.getAll('seats').length ? params.getAll('seats') : undefined,
    }), [params]);

    const travellerCount = ['flight', 'bus'].includes(line.service_type) ? line.quantity : 0;
    const [quote, setQuote] = useState(null);
    const [quoteError, setQuoteError] = useState(null);
    const [coupon, setCoupon] = useState('');
    const [applied, setApplied] = useState('');
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(false);
    const [agree, setAgree] = useState(false);
    const [form, setForm] = useState({
        contact_name: user?.name ?? '',
        contact_email: user?.email ?? '',
        contact_phone: user?.phone ?? '',
        special_requests: '',
        passengers: Array.from({ length: travellerCount }, (_, i) => ({ name: i === 0 ? user?.name ?? '' : '', passport: i === 0 ? user?.passport_no ?? '' : '' })),
    });

    useEffect(() => {
        if (!line.service_type || !line.item_id) return;
        api.post('/bookings/quote', { ...line, coupon_code: applied || undefined })
            .then(({ data }) => {
                setQuote(data);
                setQuoteError(null);
                if (applied && data.coupon_error) { toast.error(data.coupon_error); setApplied(''); }
                else if (applied && data.coupon_code) toast.success(`Coupon ${data.coupon_code} applied — you save ${money(data.discount)}!`);
            })
            .catch((e) => setQuoteError(Object.values(e.fieldErrors || {})[0]?.[0] || e.userMessage));
    }, [line, applied]);

    if (!line.service_type) return <div className="container py-5"><ErrorState message="Nothing to check out. Please choose a hotel, flight, bus, tour or car first." /></div>;
    if (quoteError) {
        return (
            <div className="container py-5">
                <ErrorState message={quoteError} />
                <button className="btn btn-primary" onClick={() => navigate(-1)}><i className="mdi mdi-arrow-left" /> Choose again</button>
            </div>
        );
    }
    if (!quote) return <Spinner className="py-5 min-vh-50" label="Checking availability & price…" />;

    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
    const setPassenger = (i, k, v) => setForm({ ...form, passengers: form.passengers.map((p, j) => (j === i ? { ...p, [k]: v } : p)) });

    const submit = async (e) => {
        e.preventDefault();
        if (!agree) { toast.warn('Please accept the booking terms.'); return; }
        setBusy(true);
        setErrors({});
        try {
            const { data } = await api.post('/bookings', {
                ...line,
                coupon_code: applied || undefined,
                contact_name: form.contact_name,
                contact_email: form.contact_email,
                contact_phone: form.contact_phone,
                special_requests: form.special_requests || undefined,
                passengers: travellerCount ? form.passengers : undefined,
            });
            toast.success(data.message);
            navigate(`/payment/${data.booking.reference}`, { replace: true });
        } catch (err) {
            setErrors(err.fieldErrors);
            toast.error(Object.values(err.fieldErrors || {})[0]?.[0] || err.userMessage);
        } finally {
            setBusy(false);
        }
    };

    const d = quote.item.details || {};

    return (
        <div className="container py-4 py-lg-5">
            <Stepper step={0} />
            <form className="row g-4" onSubmit={submit}>
                <div className="col-lg-8">
                    {/* Item summary */}
                    <div className="card border-0 p-3 mb-4">
                        <div className="d-flex gap-3 align-items-center">
                            {quote.item.image
                                ? <Img src={quote.item.image} alt="" className="rounded-3 object-cover flex-shrink-0" style={{ width: 120, height: 90 }} />
                                : <span className="feature-icon flex-shrink-0" style={{ width: 90, height: 90, fontSize: '2.4rem' }}><i className={`mdi ${SERVICE_ICON[line.service_type]}`} /></span>}
                            <div>
                                <span className="badge text-bg-primary text-capitalize mb-1">{line.service_type}</span>
                                <h5 className="fw-bold mb-1">{quote.item.name}</h5>
                                <div className="small text-soft">
                                    {line.service_type === 'hotel' && <>{date(quote.start_date)} → {date(quote.end_date)} · {quote.units} night(s) · {quote.quantity} room(s) · {line.adults} adult(s)</>}
                                    {line.service_type === 'flight' && <>{d.from} → {d.to} · {dateTime(d.departure_at)} · <span className="text-capitalize">{d.cabin_class}</span> · {quote.quantity} traveller(s)</>}
                                    {line.service_type === 'bus' && <>{dateTime(d.departure_at)} · Seats {d.seats?.join(', ')} · {d.boarding_point}</>}
                                    {line.service_type === 'tour' && <>{date(quote.start_date)} · {d.duration} · {quote.quantity} traveller(s)</>}
                                    {line.service_type === 'car' && <>{date(quote.start_date)} → {date(quote.end_date)} · {quote.units} day(s) · pick-up {d.pickup_city}</>}
                                </div>
                                {d.refundable === false && <div className="small text-danger mt-1"><i className="mdi mdi-alert-circle-outline" /> Non-refundable</div>}
                            </div>
                        </div>
                    </div>

                    {/* Contact */}
                    <div className="card border-0 p-4 mb-4">
                        <h5 className="fw-bold mb-3"><i className="mdi mdi-account-outline text-primary" /> Contact details</h5>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label" htmlFor="c-name">Full name</label>
                                <input id="c-name" className={`form-control ${errors.contact_name ? 'is-invalid' : ''}`} value={form.contact_name} onChange={set('contact_name')} required />
                                <div className="invalid-feedback">{fieldError(errors, 'contact_name')}</div>
                            </div>
                            <div className="col-md-6">
                                <label className="form-label" htmlFor="c-email">E-mail (booking confirmation is sent here)</label>
                                <input id="c-email" type="email" className={`form-control ${errors.contact_email ? 'is-invalid' : ''}`} value={form.contact_email} onChange={set('contact_email')} required />
                                <div className="invalid-feedback">{fieldError(errors, 'contact_email')}</div>
                            </div>
                            <div className="col-md-6">
                                <label className="form-label" htmlFor="c-phone">Mobile number</label>
                                <input id="c-phone" className={`form-control ${errors.contact_phone ? 'is-invalid' : ''}`} value={form.contact_phone} onChange={set('contact_phone')} placeholder="+8801XXXXXXXXX" required />
                                <div className="invalid-feedback">{fieldError(errors, 'contact_phone')}</div>
                            </div>
                        </div>
                    </div>

                    {/* Travellers */}
                    {travellerCount > 0 && (
                        <div className="card border-0 p-4 mb-4">
                            <h5 className="fw-bold mb-3"><i className="mdi mdi-account-group-outline text-primary" /> Traveller details</h5>
                            {form.passengers.map((p, i) => (
                                <div className="row g-2 mb-2" key={i}>
                                    <div className="col-md-1 d-flex align-items-center small fw-bold">{line.service_type === 'bus' ? line.seats[i] : `#${i + 1}`}</div>
                                    <div className="col-md-6"><input className="form-control" placeholder="Full name (as on ID)" value={p.name} onChange={(e) => setPassenger(i, 'name', e.target.value)} required aria-label={`Traveller ${i + 1} name`} /></div>
                                    {line.service_type === 'flight' && <div className="col-md-5"><input className="form-control" placeholder="Passport / NID (optional)" value={p.passport} onChange={(e) => setPassenger(i, 'passport', e.target.value)} aria-label={`Traveller ${i + 1} passport`} /></div>}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="card border-0 p-4 mb-4">
                        <h5 className="fw-bold mb-3"><i className="mdi mdi-message-text-outline text-primary" /> Special requests <span className="small text-soft fw-normal">(optional)</span></h5>
                        <textarea className="form-control" rows="3" maxLength={1000} value={form.special_requests} onChange={set('special_requests')} placeholder="Early check-in, airport pickup, dietary needs…" />
                    </div>

                    <div className="form-check mb-3">
                        <input className="form-check-input" type="checkbox" id="agree" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                        <label className="form-check-label small" htmlFor="agree">I agree to the <Link to="/terms" target="_blank">booking terms</Link>, cancellation policy and <Link to="/privacy" target="_blank">privacy policy</Link>.</label>
                    </div>
                    <button className="btn btn-gradient btn-lg px-5" disabled={busy}>
                        {busy ? <><span className="spinner-border spinner-border-sm me-2" />Reserving…</> : <>Continue to payment <i className="mdi mdi-arrow-right" /></>}
                    </button>
                </div>

                <div className="col-lg-4">
                    <div className="summary-sticky">
                        <PriceSummary q={{ ...quote, service_type: line.service_type }}>
                            <div className="input-group mt-3">
                                <input className="form-control text-uppercase" placeholder="Coupon code" value={coupon} onChange={(e) => setCoupon(e.target.value)} aria-label="Coupon code" />
                                {applied
                                    ? <button type="button" className="btn btn-outline-danger" onClick={() => { setApplied(''); setCoupon(''); }}>Remove</button>
                                    : <button type="button" className="btn btn-outline-primary" onClick={() => coupon && setApplied(coupon.trim())}>Apply</button>}
                            </div>
                            <div className="small text-soft mt-2"><i className="mdi mdi-tag-outline" /> Try <code>WELCOME10</code></div>
                        </PriceSummary>
                        <div className="small text-soft text-center my-3"><i className="mdi mdi-lock-outline" /> Secure booking · Instant confirmation</div>
                        <AdSlot zone="checkout_bottom" />
                    </div>
                </div>
            </form>
        </div>
    );
}
