import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { downloadFile } from '../../api/client';
import { EmptyState } from '../../components/common/Feedback';
import Pagination from '../../components/common/Pagination';
import useApi from '../../hooks/useApi';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import useQueryState from '../../hooks/useQueryState';
import { date, money, relative, SERVICE_ICON } from '../../utils/format';
import { PageHeader, StatusBadge } from '../components/AdminUI';

export default function Bookings() {
    useDocumentTitle('Bookings');
    const [q, setQ, apiParams] = useQueryState({});
    const { data, loading } = useApi('/admin/bookings', apiParams);

    const exportCsv = () => downloadFile('/admin/bookings/export', apiParams, 'bookings.csv').catch((e) => toast.error(e.userMessage));
    const select = (key, label, options) => (
        <select className="form-select w-auto" value={q[key] || ''} onChange={(e) => setQ({ [key]: e.target.value })} aria-label={label}>
            <option value="">{label}: all</option>{options.map((o) => <option key={o} value={o} className="text-capitalize">{o}</option>)}
        </select>
    );

    return (
        <>
            <PageHeader title="Bookings" subtitle="All reservations across services" icon="mdi-ticket-confirmation-outline"
                actions={<button className="btn btn-light" onClick={exportCsv}><i className="mdi mdi-download" /> Export CSV</button>} />
            <div className="card border-0">
                <div className="card-body d-flex flex-wrap gap-2 border-bottom">
                    <input className="form-control" style={{ maxWidth: 260 }} placeholder="Reference, name, e-mail…" defaultValue={q.q} onKeyDown={(e) => e.key === 'Enter' && setQ({ q: e.target.value })} aria-label="Search bookings" />
                    {select('service_type', 'Service', ['hotel', 'flight', 'bus', 'tour', 'car'])}
                    {select('status', 'Status', ['pending', 'confirmed', 'completed', 'cancelled'])}
                    {select('payment_status', 'Payment', ['unpaid', 'paid', 'refunded'])}
                    <input type="date" className="form-control w-auto" value={q.from || ''} onChange={(e) => setQ({ from: e.target.value })} aria-label="From date" />
                    <input type="date" className="form-control w-auto" value={q.to || ''} onChange={(e) => setQ({ to: e.target.value })} aria-label="To date" />
                </div>
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead><tr><th>Reference</th><th>Customer</th><th>Service</th><th>Travel date</th><th className="text-end">Total</th><th>Status</th><th>Payment</th><th>Created</th></tr></thead>
                        <tbody>
                            {loading && !data && <tr><td colSpan="8" className="text-center py-5"><span className="spinner-border text-primary" /></td></tr>}
                            {data?.data?.map((b) => (
                                <tr key={b.id}>
                                    <td className="text-nowrap"><Link to={`/admin/bookings/${b.reference}`} className="fw-semibold">{b.reference}</Link></td>
                                    <td><div>{b.contact_name}</div><div className="small text-soft">{b.contact_email}</div></td>
                                    <td style={{ maxWidth: 260 }}><div className="text-truncate"><i className={`mdi ${SERVICE_ICON[b.service_type]} text-primary`} /> {b.item_name}</div></td>
                                    <td className="text-nowrap">{date(b.start_date)}</td>
                                    <td className="text-end fw-semibold">{money(b.total)}</td>
                                    <td><StatusBadge value={b.status} /></td>
                                    <td><StatusBadge value={b.payment_status} /></td>
                                    <td className="small text-soft text-nowrap">{relative(b.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {data?.data?.length === 0 && <EmptyState title="No bookings match these filters" />}
                <div className="card-body"><Pagination meta={data} onPage={(page) => setQ({ page }, { resetPage: false })} /></div>
            </div>
        </>
    );
}
