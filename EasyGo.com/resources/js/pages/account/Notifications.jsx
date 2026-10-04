import { Link } from 'react-router-dom';
import api from '../../api/client';
import { EmptyState, Spinner } from '../../components/common/Feedback';
import useApi from '../../hooks/useApi';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { dateTime } from '../../utils/format';

export default function Notifications() {
    useDocumentTitle('Notifications');
    const { data, loading, reload } = useApi('/notifications');

    const readAll = async () => { await api.post('/notifications/read-all'); reload(); };
    const read = (id) => api.post(`/notifications/${id}/read`).catch(() => {});

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="h3 fw-800 mb-0">Notifications</h1>
                {data?.unread > 0 && <button className="btn btn-light btn-sm" onClick={readAll}><i className="mdi mdi-check-all" /> Mark all as read</button>}
            </div>
            {loading && <Spinner />}
            {data?.items?.length === 0 && <div className="card border-0"><EmptyState icon="mdi-bell-sleep-outline" title="No notifications" /></div>}
            <div className="list-group">
                {data?.items?.map((n) => (
                    <Link key={n.id} to={n.data.link || '#'} onClick={() => read(n.id)} className={`list-group-item list-group-item-action d-flex gap-3 py-3 ${n.read_at ? '' : 'border-start border-primary border-4'}`}>
                        <i className={`mdi ${n.data.icon || 'mdi-bell'} fs-4 text-primary`} />
                        <div className="flex-grow-1">
                            <div className="fw-semibold">{n.data.title}</div>
                            <div className="small text-soft">{n.data.message}</div>
                        </div>
                        <small className="text-soft text-nowrap">{dateTime(n.created_at)}</small>
                    </Link>
                ))}
            </div>
        </>
    );
}
