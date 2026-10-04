import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api/client';
import { Spinner } from '../../components/common/Feedback';
import useApi from '../../hooks/useApi';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { titleCase, toInputDateTime } from '../../utils/format';
import { PageHeader } from '../components/AdminUI';

const MAX_MB = 50;
const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/svg+xml,video/mp4,video/webm,video/ogg';
const SKIP_PRESETS = [0, 3, 5, 10, 15, 30];

const EMPTY = {
    title: '', advertiser: '', status: 'active', media_url: '', headline: '', cta_label: 'Learn more', click_url: '',
    open_in_new_tab: true, closable: true, skip_after_seconds: 5, auto_close_seconds: '', audience: 'all', device: 'all',
    weight: 5, frequency_cap: '', max_impressions: '', max_clicks: '', starts_at: '', ends_at: '', zone_ids: [],
};

/**
 * Create / edit an ad creative.
 * - Upload an image or video (drag & drop, ≤ 50 MB) or use an external media URL
 * - Pick the zones (placements) where it may appear
 * - Control close/skip timing, auto-close, targeting, weight, frequency cap, budget and schedule
 * - Live preview of the banner and interstitial rendering
 */
export default function AdForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    useDocumentTitle(id ? 'Edit ad' : 'New ad');
    const { data: zones } = useApi('/admin/ad-zones', { per_page: 100, sort: 'page', direction: 'asc' });
    const { data: existing, loading } = useApi(id ? `/admin/ads/${id}` : null);

    const [form, setForm] = useState(EMPTY);
    const [source, setSource] = useState('upload'); // upload | url
    const [file, setFile] = useState(null);
    const [poster, setPoster] = useState(null);
    const [drag, setDrag] = useState(false);
    const [errors, setErrors] = useState({});
    const [progress, setProgress] = useState(null);
    const [previewMode, setPreviewMode] = useState('banner');
    const fileRef = useRef(null);

    useEffect(() => {
        if (!existing) return;
        setForm({
            ...EMPTY,
            ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, existing[k] ?? EMPTY[k]])),
            starts_at: toInputDateTime(existing.starts_at),
            ends_at: toInputDateTime(existing.ends_at),
            zone_ids: existing.zones.map((z) => z.id),
        });
        setSource(existing.media_path ? 'upload' : 'url');
    }, [existing]);

    const filePreview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
    useEffect(() => () => filePreview && URL.revokeObjectURL(filePreview), [filePreview]);

    const set = (k) => (v) => setForm((s) => ({ ...s, [k]: v?.target ? (v.target.type === 'checkbox' ? v.target.checked : v.target.value) : v }));

    const mediaType = file ? (file.type.startsWith('video') ? 'video' : 'image')
        : source === 'url' && form.media_url ? (/\.(mp4|webm|ogg)(\?|$)/i.test(form.media_url) ? 'video' : 'image')
            : existing?.media_type;
    const mediaSrc = filePreview || (source === 'url' ? form.media_url : existing?.media_path ? existing.media_src : null);

    const pickFile = (f) => {
        if (!f) return;
        if (!ACCEPT.split(',').includes(f.type)) { toast.error('Unsupported file type. Use JPG, PNG, WebP, GIF, SVG, MP4, WebM or OGG.'); return; }
        if (f.size > MAX_MB * 1024 * 1024) { toast.error(`File is larger than ${MAX_MB} MB.`); return; }
        setFile(f);
        setSource('upload');
    };

    const zoneGroups = useMemo(() => {
        const groups = {};
        (zones?.data || []).forEach((z) => { (groups[z.page] ||= []).push(z); });
        return groups;
    }, [zones]);

    const submit = async (e) => {
        e.preventDefault();
        setErrors({});
        const body = new FormData();
        Object.entries(form).forEach(([k, v]) => {
            if (k === 'zone_ids') v.forEach((z) => body.append('zone_ids[]', z));
            else if (typeof v === 'boolean') body.append(k, v ? '1' : '0');
            else if (k === 'media_url') { if (source === 'url' && v) body.append(k, v); }
            else if (v !== '' && v !== null && v !== undefined) body.append(k, v);
        });
        if (source === 'upload' && file) body.append('media', file);
        if (poster) body.append('poster', poster);
        if (id) body.append('_method', 'PUT'); // multipart + PUT needs method spoofing in PHP

        setProgress(0);
        try {
            const { data } = await api.post(id ? `/admin/ads/${id}` : '/admin/ads', body, {
                onUploadProgress: (p) => p.total && setProgress(Math.round((p.loaded / p.total) * 100)),
            });
            toast.success(data.message);
            navigate('/admin/ads');
        } catch (err) {
            const mapped = {};
            Object.entries(err.fieldErrors || {}).forEach(([k, v]) => { mapped[k.split('.')[0]] ??= v[0]; });
            setErrors(mapped);
            toast.error(Object.values(mapped)[0] || err.userMessage);
        } finally {
            setProgress(null);
        }
    };

    if (id && loading) return <Spinner />;

    const err = (k) => errors[k] && <div className="invalid-feedback d-block">{errors[k]}</div>;

    return (
        <form onSubmit={submit}>
            <PageHeader title={id ? `Edit ad — ${existing?.title ?? ''}` : 'Create a new ad'} icon="mdi-bullhorn-outline"
                actions={<>
                    <Link to="/admin/ads" className="btn btn-light">Cancel</Link>
                    <button className="btn btn-gradient" disabled={progress !== null}>{progress !== null ? `Uploading ${progress}%` : id ? 'Save changes' : 'Publish ad'}</button>
                </>} />
            {progress !== null && <div className="progress mb-3" style={{ height: 6 }}><div className="progress-bar progress-bar-striped progress-bar-animated" style={{ width: `${progress}%` }} /></div>}

            <div className="row g-4">
                <div className="col-xl-8">
                    {/* Basics */}
                    <div className="card border-0 p-4 mb-4">
                        <h6 className="fw-bold mb-3"><span className="badge text-bg-primary me-2">1</span>Basics</h6>
                        <div className="row g-3">
                            <div className="col-md-6"><label className="form-label">Internal title *</label><input className="form-control" value={form.title} onChange={set('title')} required />{err('title')}</div>
                            <div className="col-md-3"><label className="form-label">Advertiser</label><input className="form-control" value={form.advertiser || ''} onChange={set('advertiser')} /></div>
                            <div className="col-md-3"><label className="form-label">Status</label>
                                <select className="form-select" value={form.status} onChange={set('status')}><option value="active">Active</option><option value="paused">Paused</option><option value="draft">Draft</option></select>
                            </div>
                        </div>
                    </div>

                    {/* Media */}
                    <div className="card border-0 p-4 mb-4">
                        <h6 className="fw-bold mb-3"><span className="badge text-bg-primary me-2">2</span>Creative (photo or video)</h6>
                        <div className="btn-group mb-3" role="group">
                            <button type="button" className={`btn btn-sm ${source === 'upload' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setSource('upload')}><i className="mdi mdi-upload" /> Upload file</button>
                            <button type="button" className={`btn btn-sm ${source === 'url' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setSource('url')}><i className="mdi mdi-link" /> External URL</button>
                        </div>
                        {source === 'upload' ? (
                            <div className={`upload-box ${drag ? 'drag' : ''}`} onClick={() => fileRef.current.click()}
                                onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
                                onDrop={(e) => { e.preventDefault(); setDrag(false); pickFile(e.dataTransfer.files[0]); }}>
                                <i className="mdi mdi-cloud-upload-outline display-6 text-primary" />
                                <div className="fw-semibold">{file ? file.name : existing?.media_path ? 'Replace current media' : 'Drag & drop or click to upload'}</div>
                                <div className="small text-soft">{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB · ${file.type}` : `JPG, PNG, WebP, GIF, SVG, MP4, WebM · max ${MAX_MB} MB`}</div>
                                <input ref={fileRef} type="file" accept={ACCEPT} hidden onChange={(e) => pickFile(e.target.files[0])} />
                            </div>
                        ) : (
                            <input className="form-control" placeholder="https://cdn.example.com/banner.jpg or .mp4" value={form.media_url || ''} onChange={set('media_url')} />
                        )}
                        {err('media')}{err('media_url')}
                        {mediaType === 'video' && (
                            <div className="mt-3">
                                <label className="form-label">Poster image (optional, shown before the video loads)</label>
                                <input type="file" accept="image/*" className="form-control" onChange={(e) => setPoster(e.target.files[0])} />{err('poster')}
                            </div>
                        )}
                        <div className="row g-3 mt-1">
                            <div className="col-md-6"><label className="form-label">Headline (shown on interstitials)</label><input className="form-control" value={form.headline || ''} onChange={set('headline')} /></div>
                            <div className="col-md-6"><label className="form-label">Button label</label><input className="form-control" maxLength={40} value={form.cta_label || ''} onChange={set('cta_label')} /></div>
                            <div className="col-md-8"><label className="form-label">Click-through URL</label><input className="form-control" placeholder="https://advertiser.com/offer or /hotels?q=Bali" value={form.click_url || ''} onChange={set('click_url')} />{err('click_url')}</div>
                            <div className="col-md-4 d-flex align-items-end"><div className="form-check form-switch"><input className="form-check-input" type="checkbox" id="newtab" checked={form.open_in_new_tab} onChange={set('open_in_new_tab')} /><label className="form-check-label" htmlFor="newtab">Open in new tab</label></div></div>
                        </div>
                    </div>

                    {/* Zones */}
                    <div className="card border-0 p-4 mb-4">
                        <h6 className="fw-bold mb-1"><span className="badge text-bg-primary me-2">3</span>Where should it appear? *</h6>
                        <p className="small text-soft">Select one or more zones. Interstitial zones show the ad as a full-screen popup.</p>
                        {err('zone_ids')}
                        {Object.entries(zoneGroups).map(([page, list]) => (
                            <div key={page} className="mb-3">
                                <div className="small fw-bold text-uppercase text-soft mb-2">{titleCase(page)}</div>
                                <div className="row g-2">
                                    {list.map((z) => {
                                        const on = form.zone_ids.includes(z.id);
                                        return (
                                            <div className="col-md-6" key={z.id}>
                                                <label className={`pay-method py-2 ${on ? 'active' : ''} ${z.is_active ? '' : 'opacity-50'}`}>
                                                    <input type="checkbox" className="form-check-input mt-0" checked={on} onChange={() => set('zone_ids')(on ? form.zone_ids.filter((x) => x !== z.id) : [...form.zone_ids, z.id])} />
                                                    <span className="flex-grow-1">
                                                        <span className="d-block small">{z.name}</span>
                                                        <span className="small text-soft fw-normal"><span className="badge text-bg-light">{z.placement}</span> {z.width ? `${z.width}×${z.height}` : ''}</span>
                                                    </span>
                                                </label>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Behaviour */}
                    <div className="card border-0 p-4 mb-4">
                        <h6 className="fw-bold mb-3"><span className="badge text-bg-primary me-2">4</span>Close & skip behaviour</h6>
                        <div className="form-check form-switch mb-3">
                            <input className="form-check-input" type="checkbox" id="closable" checked={form.closable} onChange={set('closable')} />
                            <label className="form-check-label" htmlFor="closable">Viewer can close / skip this ad</label>
                        </div>
                        {form.closable && (
                            <div className="mb-3">
                                <label className="form-label">Allow closing after <strong>{form.skip_after_seconds}s</strong></label>
                                <input type="range" className="form-range" min="0" max="60" value={form.skip_after_seconds} onChange={(e) => set('skip_after_seconds')(Number(e.target.value))} />
                                <div className="d-flex flex-wrap gap-2">
                                    {SKIP_PRESETS.map((s) => <button type="button" key={s} className={`chip ${Number(form.skip_after_seconds) === s ? 'active' : ''}`} onClick={() => set('skip_after_seconds')(s)}>{s === 0 ? 'Immediately' : `${s}s`}</button>)}
                                </div>
                                <div className="form-text">Like AdMob's “Skip in 5s”: the close button appears after this delay.</div>
                            </div>
                        )}
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label">Auto-close after (seconds)</label>
                                <input type="number" min="3" max="600" className="form-control" placeholder={form.closable ? 'Never' : '15 (required)'} value={form.auto_close_seconds ?? ''} onChange={set('auto_close_seconds')} />
                                <div className="form-text">{form.closable ? 'Optional. Leave empty to keep the ad until the viewer closes it.' : 'Non-closable ads must auto-close (defaults to 15s).'}</div>
                                {err('auto_close_seconds')}
                            </div>
                        </div>
                    </div>

                    {/* Targeting & delivery */}
                    <div className="card border-0 p-4 mb-4">
                        <h6 className="fw-bold mb-3"><span className="badge text-bg-primary me-2">5</span>Targeting, delivery & schedule</h6>
                        <div className="row g-3">
                            <div className="col-md-4"><label className="form-label">Audience</label>
                                <select className="form-select" value={form.audience} onChange={set('audience')}><option value="all">Everyone</option><option value="guest">Guests only</option><option value="auth">Signed-in users only</option></select>
                            </div>
                            <div className="col-md-4"><label className="form-label">Device</label>
                                <select className="form-select" value={form.device} onChange={set('device')}><option value="all">All devices</option><option value="desktop">Desktop only</option><option value="mobile">Mobile only</option></select>
                            </div>
                            <div className="col-md-4"><label className="form-label">Rotation weight: <strong>{form.weight}</strong></label><input type="range" className="form-range" min="1" max="10" value={form.weight} onChange={(e) => set('weight')(Number(e.target.value))} /></div>
                            <div className="col-md-4"><label className="form-label">Frequency cap (per viewer / day)</label><input type="number" min="1" className="form-control" placeholder="Unlimited" value={form.frequency_cap ?? ''} onChange={set('frequency_cap')} /></div>
                            <div className="col-md-4"><label className="form-label">Max impressions (budget)</label><input type="number" min="1" className="form-control" placeholder="Unlimited" value={form.max_impressions ?? ''} onChange={set('max_impressions')} /></div>
                            <div className="col-md-4"><label className="form-label">Max clicks (budget)</label><input type="number" min="1" className="form-control" placeholder="Unlimited" value={form.max_clicks ?? ''} onChange={set('max_clicks')} /></div>
                            <div className="col-md-6"><label className="form-label">Start</label><input type="datetime-local" className="form-control" value={form.starts_at || ''} onChange={set('starts_at')} /></div>
                            <div className="col-md-6"><label className="form-label">End</label><input type="datetime-local" className="form-control" value={form.ends_at || ''} onChange={set('ends_at')} />{err('ends_at')}</div>
                        </div>
                    </div>
                </div>

                {/* Live preview */}
                <div className="col-xl-4">
                    <div className="summary-sticky">
                        <div className="card border-0 p-3">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <h6 className="fw-bold mb-0">Live preview</h6>
                                <div className="btn-group btn-group-sm">
                                    {['banner', 'interstitial'].map((m) => <button type="button" key={m} className={`btn ${previewMode === m ? 'btn-dark' : 'btn-outline-dark'}`} onClick={() => setPreviewMode(m)}>{titleCase(m)}</button>)}
                                </div>
                            </div>
                            {!mediaSrc ? <div className="upload-box text-soft small">Upload media to see a preview</div> : previewMode === 'banner' ? (
                                <div className="ad-slot">
                                    <span className="ad-label">Sponsored</span>
                                    {form.closable && <span className="ad-close badge text-bg-dark rounded-pill">{form.skip_after_seconds ? `${form.skip_after_seconds}s` : '×'}</span>}
                                    {mediaType === 'video' ? <video src={mediaSrc} autoPlay muted loop playsInline /> : <img src={mediaSrc} alt="" />}
                                </div>
                            ) : (
                                <div className="rounded-4 p-3" style={{ background: 'rgba(2,6,23,.85)' }}>
                                    <div className="position-relative rounded-4 overflow-hidden bg-black">
                                        <div className="d-flex justify-content-between p-2 position-absolute top-0 start-0 end-0" style={{ zIndex: 2 }}>
                                            <span className="badge text-bg-dark">Ad · {form.advertiser || 'Sponsored'}</span>
                                            {form.closable ? <span className="badge rounded-pill text-bg-dark border">{form.skip_after_seconds ? `Skip in ${form.skip_after_seconds}s` : 'Close ×'}</span> : <span className="badge text-bg-danger">Not closable</span>}
                                        </div>
                                        {mediaType === 'video' ? <video src={mediaSrc} autoPlay muted loop playsInline className="w-100 d-block" /> : <img src={mediaSrc} alt="" className="w-100 d-block" />}
                                        <div className="ad-cta position-absolute bottom-0 start-0 end-0 p-2 d-flex justify-content-between align-items-center text-white" style={{ background: 'linear-gradient(0deg,rgba(0,0,0,.8),transparent)' }}>
                                            <small className="fw-bold">{form.headline}</small>
                                            {form.click_url && <span className="btn btn-light btn-sm rounded-pill py-0">{form.cta_label || 'Learn more'}</span>}
                                        </div>
                                    </div>
                                </div>
                            )}
                            <ul className="small text-soft mt-3 mb-0 ps-3">
                                <li>{form.zone_ids.length} zone(s) selected</li>
                                <li>{form.closable ? (Number(form.skip_after_seconds) ? `Closable after ${form.skip_after_seconds}s` : 'Closable immediately') : 'Cannot be closed by the viewer'}{form.auto_close_seconds ? `, auto-closes after ${form.auto_close_seconds}s` : ''}</li>
                                <li>Audience: {form.audience === 'all' ? 'everyone' : form.audience === 'auth' ? 'signed-in users' : 'guests'} on {form.device === 'all' ? 'all devices' : form.device}</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
}
