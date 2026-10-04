import { toast } from 'react-toastify';
import api from '../../api/client';
import { EmptyState } from '../../components/common/Feedback';
import Pagination from '../../components/common/Pagination';
import Stars from '../../components/common/Stars';
import useApi from '../../hooks/useApi';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import useQueryState from '../../hooks/useQueryState';
import { date, titleCase } from '../../utils/format';
import { PageHeader, StatusBadge } from '../components/AdminUI';

export default function Reviews() {
    useDocumentTitle('Reviews');
    const [q, setQ, apiParams] = useQueryState({});
    const { data, loading, reload } = useApi('/admin/reviews', apiParams);

    const act = async (r, status) => {
        try {
            const res = status ? await api.patch(`/admin/reviews/${r.id}`, { status }) : await api.delete(`/admin/reviews/${r.id}`);
            toast.success(res.data.message);
            reload();
        } catch (e) { toast.error(e.userMessage); }
    };

    return (
        <>
            <PageHeader title="Review moderation" subtitle="Approve or reject verified guest reviews" icon="mdi-star-outline" />
            <ul className="nav nav-pills mb-3 gap-1">
                {[['', 'All'], ['pending', 'Pending'], ['approved', 'Approved'], ['rejected', 'Rejected']].map(([v, l]) => (
                    <li key={l}><button className={`nav-link ${(q.status || '') === v ? 'active' : ''}`} onClick={() => setQ({ status: v })}>{l}</button></li>
                ))}
            </ul>
            {loading && !data && <div className="text-center py-5"><span className="spinner-border text-primary" /></div>}
            {data?.data?.length === 0 && <div className="card border-0"><EmptyState icon="mdi-star-check-outline" title="Nothing to moderate" /></div>}
            {data?.data?.map((r) => (
                <div className="card border-0 p-3 mb-3" key={r.id}>
                    <div className="d-flex flex-wrap justify-content-between gap-2">
                        <div>
                            <div className="small text-soft">{titleCase(r.target.type)} · <strong>{r.target.name}</strong></div>
                            <div className="d-flex align-items-center gap-2"><Stars value={r.rating} /><span className="fw-semibold">{r.title}</span></div>
                            <p className="mb-1 mt-1">{r.comment}</p>
                            <div className="small text-soft">{r.user?.name} ({r.user?.email}) · {date(r.created_at)}</div>
                        </div>
                        <div className="d-flex align-items-start gap-2">
                            <StatusBadge value={r.status} />
                            {r.status !== 'approved' && <button className="btn btn-sm btn-success" onClick={() => act(r, 'approved')}><i className="mdi mdi-check" /> Approve</button>}
                            {r.status !== 'rejected' && <button className="btn btn-sm btn-outline-warning" onClick={() => act(r, 'rejected')}><i className="mdi mdi-close" /> Reject</button>}
                            <button className="btn btn-sm btn-light text-danger" onClick={() => act(r)} aria-label="Delete"><i className="mdi mdi-delete-outline" /></button>
                        </div>
                    </div>
                </div>
            ))}
            <Pagination meta={data} onPage={(page) => setQ({ page }, { resetPage: false })} />
        </>
    );
}
