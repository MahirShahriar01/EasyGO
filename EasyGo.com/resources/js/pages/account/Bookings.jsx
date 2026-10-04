import { Link } from 'react-router-dom';
import { EmptyState, Spinner } from '../../components/common/Feedback';
import Pagination from '../../components/common/Pagination';
import useApi from '../../hooks/useApi';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import useQueryState from '../../hooks/useQueryState';
import BookingRow from './BookingRow';

const SCOPES = [['', 'All'], ['upcoming', 'Upcoming'], ['past', 'Past'], ['cancelled', 'Cancelled']];

export default function Bookings() {
    useDocumentTitle('My bookings');
    const [q, setQ, apiParams] = useQueryState({ scope: '' });
    const { data, loading } = useApi('/bookings', apiParams);

    return (
        <>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                <h1 className="h3 fw-800 mb-0">My bookings</h1>
                <select className="form-select w-auto" value={q.service_type || ''} onChange={(e) => setQ({ service_type: e.target.value })} aria-label="Service">
                    <option value="">All services</option>{['hotel', 'flight', 'bus', 'tour', 'car'].map((s) => <option key={s} value={s} className="text-capitalize">{s}</option>)}
                </select>
            </div>
            <ul className="nav nav-pills mb-4 gap-1">
                {SCOPES.map(([v, l]) => <li className="nav-item" key={l}><button className={`nav-link ${(q.scope || '') === v ? 'active' : ''}`} onClick={() => setQ({ scope: v })}>{l}</button></li>)}
            </ul>
            {loading && <Spinner />}
            {!loading && data?.data?.length === 0 && <div className="card border-0"><EmptyState icon="mdi-ticket-outline" title="No bookings found" action={<Link to="/" className="btn btn-gradient">Book your first trip</Link>} /></div>}
            {!loading && data?.data?.map((b) => <BookingRow key={b.id} b={b} />)}
            <Pagination meta={data} onPage={(page) => setQ({ page }, { resetPage: false })} />
        </>
    );
}
