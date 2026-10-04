import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api/client';
import { EmptyState } from '../../components/common/Feedback';
import { ConfirmModal } from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import useApi from '../../hooks/useApi';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import useQueryState from '../../hooks/useQueryState';
import { compact, date } from '../../utils/format';
import { KpiCard, PageHeader, StatusBadge } from '../components/AdminUI';

/** Thumbnail of an ad creative (image or muted video). */
export function CreativeThumb({ ad, style = { width: 120, height: 68 } }) {
    return ad.media_type === 'video'
        ? <video src={ad.media_src} poster={ad.poster_src || undefined} muted className="rounded-3 bg-dark object-cover" style={style} />
        : <img src={ad.media_src} alt="" className="rounded-3 bg-body-tertiary object-cover" style={{ ...style, objectFit: 'contain' }} />;
}

export default function Ads() {
    useDocumentTitle('Ads');
    const [q, setQ, apiParams] = useQueryState({});
    const { data, loading, reload } = useApi('/admin/ads', { per_page: 12, ...apiParams });
    const { data: overview } = useApi('/admin/ads/overview', { days: 30 });
    const { data: zones } = useApi('/admin/ad-zones', { per_page: 100, sort: 'name', direction: 'asc' });
    const [deleting, setDeleting] = useState(null);

    const act = async (fn) => {
        try {
            const { data: res } = await fn();
            toast.success(res.message);
            reload();
        } catch (e) {
            toast.error(e.userMessage);
        }
    };

    return (
        <>
            <PageHeader title="Advertising" subtitle="Image & video ads served in zones across the customer site" icon="mdi-bullhorn-outline"
                actions={<>
                    <Link to="/admin/ad-zones" className="btn btn-light"><i className="mdi mdi-view-grid-plus-outline" /> Zones</Link>
                    <Link to="/admin/ads/new" className="btn btn-gradient"><i className="mdi mdi-plus" /> New ad</Link>
                </>} />

            {overview && (
                <div className="row g-3 mb-4">
                    <div className="col-6 col-xl-3"><KpiCard label="Running ads" value={overview.active_ads} icon="mdi-play-circle-outline" color="success" /></div>
                    <div className="col-6 col-xl-3"><KpiCard label="Impressions (30d)" value={compact(overview.impressions)} icon="mdi-eye-outline" /></div>
                    <div className="col-6 col-xl-3"><KpiCard label="Clicks (30d)" value={compact(overview.clicks)} icon="mdi-cursor-default-click-outline" color="warning" /></div>
                    <div className="col-6 col-xl-3"><KpiCard label="CTR (30d)" value={`${overview.ctr}%`} icon="mdi-percent-outline" color="info" hint={<span className="text-soft">{compact(overview.skips)} skips · {compact(overview.completes)} completes</span>} /></div>
                </div>
            )}

            <div className="card border-0">
                <div className="card-body d-flex flex-wrap gap-2 border-bottom">
                    <input className="form-control" style={{ maxWidth: 280 }} placeholder="Search ads…" defaultValue={q.q} onKeyDown={(e) => e.key === 'Enter' && setQ({ q: e.target.value })} aria-label="Search ads" />
                    <select className="form-select w-auto" value={q.status || ''} onChange={(e) => setQ({ status: e.target.value })} aria-label="Status">
                        <option value="">All statuses</option><option value="active">Active</option><option value="paused">Paused</option><option value="draft">Draft</option>
                    </select>
                    <select className="form-select w-auto" value={q.media_type || ''} onChange={(e) => setQ({ media_type: e.target.value })} aria-label="Media type">
                        <option value="">Image & video</option><option value="image">Image</option><option value="video">Video</option>
                    </select>
                    <select className="form-select w-auto" value={q.zone_id || ''} onChange={(e) => setQ({ zone_id: e.target.value })} aria-label="Zone">
                        <option value="">All zones</option>{zones?.data?.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
                    </select>
                </div>
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead><tr><th>Creative</th><th>Ad</th><th>Zones</th><th>Schedule</th><th>Close rule</th><th className="text-end">Impr.</th><th className="text-end">Clicks</th><th className="text-end">CTR</th><th>State</th><th className="text-end">Actions</th></tr></thead>
                        <tbody>
                            {loading && !data && <tr><td colSpan="10" className="text-center py-5"><span className="spinner-border text-primary" /></td></tr>}
                            {data?.data?.map((ad) => (
                                <tr key={ad.id}>
                                    <td><CreativeThumb ad={ad} /></td>
                                    <td style={{ minWidth: 220 }}>
                                        <div className="fw-semibold">{ad.title}</div>
                                        <div className="small text-soft">{ad.advertiser} · <i className={`mdi ${ad.media_type === 'video' ? 'mdi-video-outline' : 'mdi-image-outline'}`} /> {ad.media_type} · weight {ad.weight}</div>
                                    </td>
                                    <td style={{ minWidth: 180, maxWidth: 240 }}>{ad.zones.map((z) => <span key={z.id} className="badge text-bg-light me-1 mb-1">{z.name}</span>)}</td>
                                    <td className="small text-nowrap">{ad.starts_at ? date(ad.starts_at) : 'Now'} → {ad.ends_at ? date(ad.ends_at) : '∞'}</td>
                                    <td className="small text-nowrap">
                                        {ad.closable ? (ad.skip_after_seconds ? <>Skip after {ad.skip_after_seconds}s</> : 'Close anytime') : <span className="text-danger">Not closable</span>}
                                        {ad.auto_close_seconds ? <div className="text-soft">Auto-close {ad.auto_close_seconds}s</div> : null}
                                        {ad.frequency_cap ? <div className="text-soft">Cap {ad.frequency_cap}/day</div> : null}
                                    </td>
                                    <td className="text-end">{compact(ad.impressions_count)}{ad.max_impressions ? <div className="small text-soft">/ {compact(ad.max_impressions)}</div> : null}</td>
                                    <td className="text-end">{compact(ad.clicks_count)}</td>
                                    <td className="text-end fw-semibold">{ad.ctr}%</td>
                                    <td><StatusBadge value={ad.delivery_state} /></td>
                                    <td className="text-end text-nowrap">
                                        <button className="btn btn-sm btn-light me-1" title={ad.status === 'active' ? 'Pause' : 'Activate'} onClick={() => act(() => api.post(`/admin/ads/${ad.id}/toggle`))}>
                                            <i className={`mdi ${ad.status === 'active' ? 'mdi-pause' : 'mdi-play'}`} />
                                        </button>
                                        <Link to={`/admin/ads/${ad.id}/stats`} className="btn btn-sm btn-light me-1" title="Analytics"><i className="mdi mdi-chart-line" /></Link>
                                        <Link to={`/admin/ads/${ad.id}/edit`} className="btn btn-sm btn-light me-1" title="Edit"><i className="mdi mdi-pencil" /></Link>
                                        <button className="btn btn-sm btn-light me-1" title="Duplicate" onClick={() => act(() => api.post(`/admin/ads/${ad.id}/duplicate`))}><i className="mdi mdi-content-copy" /></button>
                                        <button className="btn btn-sm btn-light text-danger" title="Delete" onClick={() => setDeleting(ad)}><i className="mdi mdi-delete-outline" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {data?.data?.length === 0 && <EmptyState icon="mdi-bullhorn-outline" title="No ads yet" action={<Link to="/admin/ads/new" className="btn btn-gradient">Create your first ad</Link>} />}
                <div className="card-body"><Pagination meta={data} onPage={(page) => setQ({ page }, { resetPage: false })} /></div>
            </div>

            <ConfirmModal show={Boolean(deleting)} onClose={() => setDeleting(null)} title="Delete ad?" confirmLabel="Delete"
                message={`“${deleting?.title}” and its uploaded media will be deleted. Analytics history for this ad is removed too.`}
                onConfirm={() => { act(() => api.delete(`/admin/ads/${deleting.id}`)); setDeleting(null); }} />
        </>
    );
}
