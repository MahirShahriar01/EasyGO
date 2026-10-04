import { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/client';
import { EmptyState } from '../../components/common/Feedback';
import Pagination from '../../components/common/Pagination';
import useApi from '../../hooks/useApi';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import useQueryState from '../../hooks/useQueryState';
import { dateTime, relative } from '../../utils/format';
import { PageHeader, StatusBadge } from '../components/AdminUI';

/** Two-pane support inbox: message list + reader with reply box. */
export default function Messages() {
    useDocumentTitle('Messages');
    const [q, setQ, apiParams] = useQueryState({});
    const { data, reload } = useApi('/admin/messages', apiParams);
    const [open, setOpen] = useState(null);
    const [reply, setReply] = useState('');
    const [busy, setBusy] = useState(false);

    const view = async (m) => {
        const { data: full } = await api.get(`/admin/messages/${m.id}`);
        setOpen(full);
        setReply('');
        reload();
    };

    const send = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            const { data: res } = await api.post(`/admin/messages/${open.id}/reply`, { reply });
            toast.success(res.message);
            setOpen(res.item);
            reload();
        } catch (err) { toast.error(err.userMessage); } finally { setBusy(false); }
    };

    const remove = async () => {
        await api.delete(`/admin/messages/${open.id}`);
        toast.success('Message deleted.');
        setOpen(null);
        reload();
    };

    return (
        <>
            <PageHeader title="Support inbox" subtitle="Messages from the contact form" icon="mdi-message-text-outline" />
            <div className="row g-4">
                <div className="col-lg-5">
                    <div className="card border-0">
                        <div className="card-body border-bottom d-flex gap-2">
                            <select className="form-select" value={q.status || ''} onChange={(e) => setQ({ status: e.target.value })} aria-label="Status">
                                <option value="">All messages</option><option value="new">New</option><option value="read">Read</option><option value="replied">Replied</option>
                            </select>
                        </div>
                        <div className="list-group list-group-flush">
                            {data?.data?.map((m) => (
                                <button key={m.id} className={`list-group-item list-group-item-action py-3 ${open?.id === m.id ? 'active' : ''}`} onClick={() => view(m)}>
                                    <div className="d-flex justify-content-between"><strong className={m.status === 'new' ? '' : 'fw-normal'}>{m.name}</strong><small>{relative(m.created_at)}</small></div>
                                    <div className="small text-truncate">{m.subject}</div>
                                    <StatusBadge value={m.status} />
                                </button>
                            ))}
                        </div>
                        {data?.data?.length === 0 && <EmptyState icon="mdi-inbox" title="Inbox zero 🎉" />}
                        <div className="card-body"><Pagination meta={data} onPage={(page) => setQ({ page }, { resetPage: false })} /></div>
                    </div>
                </div>
                <div className="col-lg-7">
                    {open ? (
                        <div className="card border-0 p-4">
                            <div className="d-flex justify-content-between">
                                <div><h5 className="fw-bold mb-1">{open.subject}</h5><div className="small text-soft">{open.name} &lt;{open.email}&gt; · {dateTime(open.created_at)}</div></div>
                                <button className="btn btn-sm btn-light text-danger align-self-start" onClick={remove} aria-label="Delete"><i className="mdi mdi-delete-outline" /></button>
                            </div>
                            <p className="mt-3" style={{ whiteSpace: 'pre-line' }}>{open.message}</p>
                            {open.admin_reply && <div className="alert alert-success"><div className="small fw-bold mb-1">Your reply · {dateTime(open.replied_at)}</div>{open.admin_reply}</div>}
                            <form onSubmit={send}>
                                <label className="form-label" htmlFor="reply">{open.admin_reply ? 'Send another reply' : 'Reply'}</label>
                                <textarea id="reply" className="form-control mb-2" rows="5" value={reply} onChange={(e) => setReply(e.target.value)} required />
                                <button className="btn btn-gradient" disabled={busy}><i className="mdi mdi-send" /> {busy ? 'Sending…' : 'Send reply by e-mail'}</button>
                            </form>
                        </div>
                    ) : <div className="card border-0"><EmptyState icon="mdi-email-open-outline" title="Select a message" /></div>}
                </div>
            </div>
        </>
    );
}
