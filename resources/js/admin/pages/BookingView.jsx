import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api/client';
import { Spinner } from '../../components/common/Feedback';
import { ConfirmModal } from '../../components/common/Modal';
import useApi from '../../hooks/useApi';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { date, dateTime, money, titleCase } from '../../utils/format';
import { PageHeader, StatusBadge } from '../components/AdminUI';

export default function BookingView() {
    const { reference } = useParams();
    useDocumentTitle(`Booking ${reference}`);
    const { data: b, loading, reload } = useApi(`/admin/bookings/${reference}`);
    const [cancelOpen, setCancelOpen] = useState(false);
    const [reason, setReason] = useState('');
    const [busy, setBusy] = useState(false);

    if (loading && !b) return <Spinner />;

    const patch = async (payload) => {
        try {
            const { data } = await api.patch(`/admin/bookings/${b.reference}`, payload);
            toast.success(data.message);
            reload();
        } catch (e) { toast.error(e.userMessage); }
    };

    const cancel = async () => {
        setBusy(true);
        try {
            const { data } = await api.post(`/admin/bookings/${b.reference}/cancel`, { reason });
            toast.success(data.message);
            setCancelOpen(false);
            reload();
        } catch (e) { toast.error(Object.values(e.fieldErrors || {})[0]?.[0] || e.userMessage); } finally { setBusy(false); }
    };

    const details = Object.entries(b.details || {}).filter(([, v]) => v !== null && typeof v !== 'object');

    return (
        <>
            <Link to="/admin/bookings" className="small d-inline-block mb-2"><i className="mdi mdi-arrow-left" /> All bookings</Link>
            <PageHeader title={`Booking ${b.reference}`} subtitle={b.item_name} icon="mdi-ticket-confirmation-outline"
                actions={<>
                    {b.status === 'confirmed' && <button className="btn btn-outline-primary" onClick={() => patch({ status: 'completed' })}><i className="mdi mdi-check-all" /> Mark completed</button>}
                    {b.status === 'pending' && <button className="btn btn-outline-success" onClick={() => patch({ status: 'confirmed' })}><i className="mdi mdi-check" /> Confirm</button>}
                    {b.payment_status === 'unpaid' && b.status !== 'cancelled' && <button className="btn btn-outline-success" onClick={() => patch({ payment_status: 'paid' })}><i className="mdi mdi-cash-check" /> Mark paid</button>}
                    {['pending', 'confirmed'].includes(b.status) && <button className="btn btn-outline-danger" onClick={() => setCancelOpen(true)}><i className="mdi mdi-close-circle-outline" /> Cancel & refund</button>}
                </>} />

            <div className="row g-4">
                <div className="col-lg-8">
                    <div className="card border-0 p-4 mb-4">
                        <div className="d-flex gap-2 mb-3"><StatusBadge value={b.status} /><StatusBadge value={b.payment_status} /><span className="badge text-bg-light text-capitalize">{b.service_type}</span></div>
                        <div className="row g-3">
                            {[['Travel date', `${date(b.start_date)}${b.end_date ? ` → ${date(b.end_date)}` : ''}`], ['Quantity', `${b.quantity} × ${b.units} unit(s)`], ['Guests', `${b.adults} adults, ${b.children} children`],
                                ['Created', dateTime(b.created_at)], ['Confirmed', dateTime(b.confirmed_at)], ['Payment method', titleCase(b.payment_method || '—')],
                                ...details.map(([k, v]) => [titleCase(k), typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v)])].map(([k, v]) => (
                                <div className="col-md-4" key={k}><div className="small text-soft">{k}</div><div className="fw-semibold text-break">{v}</div></div>
                            ))}
                        </div>
                        {b.details?.seats && <div className="mt-3"><span className="small text-soft">Seats:</span> {b.details.seats.join(', ')}</div>}
                        {b.details?.passengers?.length > 0 && <div className="mt-3"><div className="small text-soft">Travellers</div><ol className="mb-0">{b.details.passengers.map((p, i) => <li key={i}>{p.name} {p.passport && `· ${p.passport}`}</li>)}</ol></div>}
                        {b.special_requests && <div className="alert alert-light mt-3 mb-0"><strong>Special requests:</strong> {b.special_requests}</div>}
                        {b.status === 'cancelled' && <div className="alert alert-danger mt-3 mb-0">Cancelled {dateTime(b.cancelled_at)} — {b.cancellation_reason}. Refunded {money(b.refund_amount)}.</div>}
                    </div>
                    <div className="card border-0">
                        <div className="card-body pb-0"><h6 className="fw-bold">Payment transactions</h6></div>
                        <table className="table mb-0"><thead><tr><th>Method</th><th>Gateway</th><th>Transaction</th><th className="text-end">Amount</th><th>Status</th><th>Date</th></tr></thead>
                            <tbody>{b.payments.length === 0 ? <tr><td colSpan="6" className="text-soft text-center">No payment attempts</td></tr> : b.payments.map((p) => (
                                <tr key={p.id}><td>{titleCase(p.method)}</td><td>{p.gateway}</td><td className="small">{p.transaction_id || '—'}{p.failure_reason && <div className="text-danger">{p.failure_reason}</div>}</td><td className="text-end">{money(p.amount)}</td><td><StatusBadge value={p.status === 'succeeded' ? 'paid' : p.status} /></td><td className="small">{dateTime(p.created_at)}</td></tr>
                            ))}</tbody>
                        </table>
                    </div>
                </div>
                <div className="col-lg-4">
                    <div className="card border-0 p-4 mb-4">
                        <h6 className="fw-bold">Customer</h6>
                        <div className="fw-semibold">{b.contact_name}</div>
                        <div className="small">{b.contact_email}</div>
                        <div className="small">{b.contact_phone}</div>
                        {b.user && <div className="small text-soft mt-2">Account: {b.user.name} (#{b.user.id})</div>}
                    </div>
                    <div className="card border-0 p-4">
                        <h6 className="fw-bold">Amount</h6>
                        {[['Unit price', money(b.unit_price)], ['Subtotal', money(b.subtotal)], [`Discount ${b.coupon_code ? `(${b.coupon_code})` : ''}`, `−${money(b.discount)}`], ['Service fee', money(b.service_fee)], ['Tax', money(b.tax)]].map(([k, v]) => (
                            <div key={k} className="d-flex justify-content-between small mb-1"><span>{k}</span><span>{v}</span></div>
                        ))}
                        <hr /><div className="d-flex justify-content-between fw-800 fs-5"><span>Total</span><span>{money(b.total)}</span></div>
                    </div>
                </div>
            </div>
            <ConfirmModal show={cancelOpen} onClose={() => setCancelOpen(false)} onConfirm={cancel} busy={busy} title="Cancel booking & refund?" confirmLabel="Cancel booking">
                <p>The customer is notified by e-mail{b.payment_status === 'paid' ? <> and refunded the full <strong>{money(b.total)}</strong></> : ''}.</p>
                <input className="form-control" placeholder="Reason shown to the customer" value={reason} onChange={(e) => setReason(e.target.value)} />
            </ConfirmModal>
        </>
    );
}
