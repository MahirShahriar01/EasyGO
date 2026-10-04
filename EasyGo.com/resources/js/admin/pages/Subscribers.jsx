import { toast } from 'react-toastify';
import api, { downloadFile } from '../../api/client';
import Pagination from '../../components/common/Pagination';
import useApi from '../../hooks/useApi';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import useQueryState from '../../hooks/useQueryState';
import { dateTime } from '../../utils/format';
import { PageHeader, StatusBadge } from '../components/AdminUI';

export default function Subscribers() {
    useDocumentTitle('Subscribers');
    const [q, setQ, apiParams] = useQueryState({});
    const { data, reload } = useApi('/admin/subscribers', apiParams);

    const remove = async (s) => {
        const { data: res } = await api.delete(`/admin/subscribers/${s.id}`);
        toast.success(res.message);
        reload();
    };

    return (
        <>
            <PageHeader title="Newsletter subscribers" subtitle={`${data?.total ?? 0} subscribers`} icon="mdi-email-multiple-outline"
                actions={<button className="btn btn-light" onClick={() => downloadFile('/admin/subscribers/export', {}, 'subscribers.csv')}><i className="mdi mdi-download" /> Export CSV</button>} />
            <div className="card border-0">
                <div className="card-body border-bottom">
                    <input className="form-control" style={{ maxWidth: 300 }} placeholder="Search e-mail…" defaultValue={q.q} onKeyDown={(e) => e.key === 'Enter' && setQ({ q: e.target.value })} aria-label="Search" />
                </div>
                <table className="table align-middle mb-0">
                    <thead><tr><th>E-mail</th><th>Status</th><th>Subscribed</th><th /></tr></thead>
                    <tbody>{data?.data?.map((s) => (
                        <tr key={s.id}><td>{s.email}</td><td><StatusBadge value={s.is_active} /></td><td>{dateTime(s.created_at)}</td>
                            <td className="text-end"><button className="btn btn-sm btn-light text-danger" onClick={() => remove(s)} aria-label="Remove"><i className="mdi mdi-delete-outline" /></button></td></tr>
                    ))}</tbody>
                </table>
                <div className="card-body"><Pagination meta={data} onPage={(page) => setQ({ page }, { resetPage: false })} /></div>
            </div>
        </>
    );
}
