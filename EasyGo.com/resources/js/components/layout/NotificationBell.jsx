import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { relative } from '../../utils/format';
import Dropdown from './Dropdown';

/** Bell icon with unread badge and the latest in-app notifications. */
export default function NotificationBell({ className = '' }) {
    const [data, setData] = useState({ unread: 0, items: [] });

    const load = () => api.get('/notifications').then(({ data: d }) => setData(d)).catch(() => {});
    useEffect(() => {
        load();
        const t = setInterval(load, 60000);
        return () => clearInterval(t);
    }, []);

    const readAll = async () => {
        await api.post('/notifications/read-all');
        load();
    };

    return (
        <Dropdown
            menuClassName="p-0 overflow-hidden"
            toggle={({ onClick }) => (
                <button type="button" className={`btn btn-icon btn-link position-relative ${className}`} onClick={() => { onClick(); load(); }} aria-label="Notifications">
                    <i className="mdi mdi-bell-outline fs-5" />
                    {data.unread > 0 && <span className="notif-dot badge bg-danger">{data.unread}</span>}
                </button>
            )}
        >
            <div style={{ width: 340 }}>
                <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
                    <strong>Notifications</strong>
                    {data.unread > 0 && <button className="btn btn-link btn-sm p-0" data-close onClick={readAll}>Mark all read</button>}
                </div>
                <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                    {data.items.length === 0 && <div className="p-4 text-center text-soft small">You're all caught up ✨</div>}
                    {data.items.map((n) => (
                        <Link key={n.id} to={n.data.link || '/account/notifications'} className={`dropdown-item d-flex gap-2 py-2 text-wrap ${n.read_at ? '' : 'bg-primary bg-opacity-10'}`}>
                            <i className={`mdi ${n.data.icon || 'mdi-bell'} text-primary fs-5`} />
                            <span>
                                <span className="fw-semibold d-block small">{n.data.title}</span>
                                <span className="small text-soft d-block">{n.data.message}</span>
                                <span className="small text-soft">{relative(n.created_at)}</span>
                            </span>
                        </Link>
                    ))}
                </div>
                <Link to="/account/notifications" className="dropdown-item text-center small fw-semibold border-top py-2">View all</Link>
            </div>
        </Dropdown>
    );
}
