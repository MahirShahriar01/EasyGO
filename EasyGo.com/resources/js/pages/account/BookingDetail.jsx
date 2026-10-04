import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api/client';
import { ErrorState, Spinner } from '../../components/common/Feedback';
import { ConfirmModal } from '../../components/common/Modal';
import ReviewForm from '../../components/reviews/ReviewForm';
import useApi from '../../hooks/useApi';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { date, dateTime, money, SERVICE_ICON, STATUS_BADGE, titleCase } from '../../utils/format';

/** Booking voucher / e-ticket with print, cancel (with refund estimate) and review actions. */
export default function BookingDetail() {
    const { reference } = useParams();
    const settings = useSelector((s) => s.settings);
    const { data, loading, error, reload } = useApi(`/bookings/${reference}`);
    const [confirm, setConfirm] = useState(false);
    const [reason, setReason] = useState('');
    const [busy, setBusy] = useState(false);
    const [reviewed, setReviewed] = useState(false);
    useDocumentTitle(`Booking ${reference}`);

    if (loading && !data) return <Spinner />;
    if (error) return <ErrorState message={error} onRetry={reload} />;
    const b = data.booking;
    const d = b.details || {};

    const cancel = async () => {
        setBusy(true);
        try {
            const { data: res } = await api.post(`/bookings/${b.reference}/cancel`, { reason });
            toast.success(res.message);
            setConfirm(false);
            reload();
        } catch (e) {
            toast.error(Object.values(e.fieldErrors || {})[0]?.[0] || e.userMessage);
        } finally {
            setBusy(false);
        }
    };

    const rows = [
        ['Booked on', dateTime(b.created_at)],
        [b.service_type === 'hotel' ? 'Check-in' : b.service_type === 'car' ? 'Pick-up' : 'Travel date', `${date(b.start_date)}${d.check_in_time ? ` from ${d.check_in_time}` : ''}`],
        ...(b.end_date && ['hotel', 'car', 'tour'].includes(b.service_type) ? [[b.service_type === 'hotel' ? 'Check-out' : b.service_type === 'car' ? 'Drop-off' : 'Returns', `${date(b.end_date)}${d.check_out_time ? ` until ${d.check_out_time}` : ''}`]] : []),
        ...(d.departure_at ? [['Departure', dateTime(d.departure_at)], ['Arrival', dateTime(d.arrival_at)]] : []),
        ...(d.from ? [['Route', `${d.from} → ${d.to}`]] : []),
        ...(d.seats ? [['Seats', d.seats.join(', ')]] : []),
        ...(d.boarding_point ? [['Boarding point', d.boarding_point]] : []),
        ...(d.cabin_class ? [['Cabin', titleCase(d.cabin_class)]] : []),
        ...(d.baggage ? [['Baggage', d.baggage]] : []),
        ...(d.room_name ? [['Room', `${b.quantity} × ${d.room_name}`]] : []),
        ...(d.address ? [['Address', d.address]] : []),
        ['Guests / travellers', `${b.adults} adult(s)${b.children ? `, ${b.children} child(ren)` : ''}`],
        ['Lead guest', `${b.contact_name} · ${b.contact_email} · ${b.contact_phone || ''}`],
    ];

    return (
        <>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3 no-print">
                <Link to="/account/bookings" className="small"><i className="mdi mdi-arrow-left" /> My bookings</Link>
                <div className="d-flex gap-2">
                    {b.can_pay && <Link to={`/payment/${b.reference}`} className="btn btn-gradient btn-sm"><i className="mdi mdi-credit-card-outline" /> Pay now</Link>}
                    <button className="btn btn-light btn-sm" onClick={() => window.print()}><i className="mdi mdi-printer" /> Print / PDF</button>
                    {b.can_cancel && <button className="btn btn-outline-danger btn-sm" onClick={() => setConfirm(true)}><i className="mdi mdi-close-circle-outline" /> Cancel booking</button>}
                </div>
            </div>

            <div className="card border-0 overflow-hidden">
                <div className="bg-gradient-brand p-4 d-flex flex-wrap justify-content-between gap-3">
                    <div>
                        <div className="small opacity-75 text-uppercase fw-bold"><i className={`mdi ${SERVICE_ICON[b.service_type]}`} /> {b.service_type} {b.service_type === 'hotel' ? 'voucher' : 'e-ticket'}</div>
                        <h1 className="h4 fw-800 mb-0">{b.item_name}</h1>
                    </div>
                    <div className="text-end">
                        <div className="small opacity-75">Reference</div>
                        <div className="fs-4 fw-800">{b.reference}</div>
                    </div>
                </div>
                <div className="card-body p-4">
                    <div className="d-flex flex-wrap gap-2 mb-4">
                        <span className={`badge text-bg-${STATUS_BADGE[b.status]} text-capitalize fs-6`}>{b.status}</span>
                        <span className={`badge text-bg-${STATUS_BADGE[b.payment_status]} text-capitalize fs-6`}>{b.payment_status}{b.payment_method ? ` · ${titleCase(b.payment_method)}` : ''}</span>
                        {b.status === 'cancelled' && <span className="small text-soft align-self-center">{b.cancellation_reason} · {dateTime(b.cancelled_at)}</span>}
                    </div>
                    <div className="row g-4">
                        <div className="col-md-7">
                            <table className="table table-sm mb-0">
                                <tbody>{rows.map(([k, v]) => <tr key={k}><th className="text-soft fw-semibold border-0 ps-0" style={{ width: '40%' }}>{k}</th><td className="border-0">{v}</td></tr>)}</tbody>
                            </table>
                            {d.passengers?.length > 0 && (
                                <>
                                    <h6 className="fw-bold mt-3">Travellers</h6>
                                    <ol className="small mb-0">{d.passengers.map((p, i) => <li key={i}>{p.name}{p.passport ? ` · ${p.passport}` : ''}</li>)}</ol>
                                </>
                            )}
                            {b.special_requests && <div className="small mt-3"><strong>Special requests:</strong> {b.special_requests}</div>}
                        </div>
                        <div className="col-md-5">
                            <div className="bg-body-tertiary rounded-4 p-3">
                                <div className="d-flex justify-content-between small mb-1"><span>Subtotal</span><span>{money(b.subtotal)}</span></div>
                                {b.discount > 0 && <div className="d-flex justify-content-between small mb-1 text-success"><span>Discount ({b.coupon_code})</span><span>−{money(b.discount)}</span></div>}
                                <div className="d-flex justify-content-between small mb-1"><span>Service fee</span><span>{money(b.service_fee)}</span></div>
                                <div className="d-flex justify-content-between small mb-1"><span>Taxes</span><span>{money(b.tax)}</span></div>
                                <hr className="my-2" />
                                <div className="d-flex justify-content-between fw-800 fs-5"><span>Total</span><span>{money(b.total)}</span></div>
                                {b.refund_amount > 0 && <div className="d-flex justify-content-between small text-info mt-1"><span>Refunded</span><span>{money(b.refund_amount)}</span></div>}
                            </div>
                            {b.payments?.length > 0 && (
                                <div className="small mt-3">
                                    <div className="fw-bold mb-1">Payments</div>
                                    {b.payments.map((p) => (
                                        <div key={p.id} className="d-flex justify-content-between border-bottom py-1">
                                            <span>{titleCase(p.method)} <span className={`badge text-bg-${p.status === 'succeeded' ? 'success' : p.status === 'failed' ? 'danger' : 'info'}`}>{p.status}</span></span>
                                            <span className="text-soft">{p.transaction_id || '—'}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <hr />
                    <div className="small text-soft">
                        Need help? Contact {settings.site_name} support at {settings.contact_phone} or {settings.contact_email}. Please present this {b.service_type === 'hotel' ? 'voucher' : 'ticket'} and a valid photo ID.
                    </div>
                </div>
            </div>

            {data.can_review && !reviewed && (
                <div className="card border-0 p-4 mt-4 no-print">
                    <h5 className="fw-bold">How was your {b.service_type === 'hotel' ? 'stay' : 'trip'}?</h5>
                    <p className="small text-soft">Your verified review helps other travellers.</p>
                    <ReviewForm target={data.review_target} onDone={() => setReviewed(true)} />
                </div>
            )}

            <ConfirmModal show={confirm} onClose={() => setConfirm(false)} onConfirm={cancel} busy={busy} title="Cancel this booking?" confirmLabel="Yes, cancel booking">
                <p>{b.payment_status === 'paid'
                    ? <>Based on the cancellation policy you will be refunded <strong>{money(data.refund_estimate)}</strong> of {money(b.total)}.</>
                    : 'No payment has been taken for this booking.'}</p>
                <label className="form-label" htmlFor="reason">Reason (optional)</label>
                <input id="reason" className="form-control" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Change of plans" />
            </ConfirmModal>
        </>
    );
}
