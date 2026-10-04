import { useRef, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/client';
import Img from '../../components/common/Img';

/** Resolve a stored path to a previewable URL (mirrors the backend ResolvesMedia trait). */
export const previewUrl = (path) => (!path ? null : /^(https?:)?\/\//.test(path) || path.startsWith('/') ? path : `/storage/${path}`);

/**
 * Single image: upload to /api/admin/uploads (returns a storage path) or paste a URL.
 * The stored value is always a string (path or URL).
 */
export function ImageInput({ value, onChange, folder = 'misc' }) {
    const ref = useRef(null);
    const [busy, setBusy] = useState(false);

    const upload = async (file) => {
        if (!file) return;
        setBusy(true);
        const body = new FormData();
        body.append('file', file);
        body.append('folder', folder);
        try {
            const { data } = await api.post('/admin/uploads', body);
            onChange(data.path);
        } catch (e) {
            toast.error(e.fieldErrors?.file?.[0] || e.userMessage);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="d-flex gap-3 align-items-start">
            <div className="border rounded-3 overflow-hidden bg-body-tertiary flex-shrink-0 d-flex align-items-center justify-content-center" style={{ width: 96, height: 72 }}>
                {value ? <Img src={previewUrl(value)} alt="" className="w-100 h-100 object-cover" /> : <i className="mdi mdi-image-outline fs-3 text-soft" />}
            </div>
            <div className="flex-grow-1">
                <div className="input-group input-group-sm mb-1">
                    <input className="form-control" placeholder="https://… or upload" value={value || ''} onChange={(e) => onChange(e.target.value)} />
                    <button type="button" className="btn btn-outline-primary" onClick={() => ref.current.click()} disabled={busy}>
                        {busy ? <span className="spinner-border spinner-border-sm" /> : <><i className="mdi mdi-upload" /> Upload</>}
                    </button>
                    {value && <button type="button" className="btn btn-outline-danger" onClick={() => onChange('')} aria-label="Remove"><i className="mdi mdi-close" /></button>}
                </div>
                <input type="file" accept="image/*" hidden ref={ref} onChange={(e) => { upload(e.target.files[0]); e.target.value = ''; }} />
            </div>
        </div>
    );
}

/** Multiple images (array of paths/URLs) with upload, URL add and reorder-free removal. */
export function GalleryInput({ value = [], onChange, folder = 'misc' }) {
    const ref = useRef(null);
    const [url, setUrl] = useState('');
    const [busy, setBusy] = useState(false);
    const list = value || [];

    const upload = async (files) => {
        setBusy(true);
        const added = [];
        for (const file of files) {
            const body = new FormData();
            body.append('file', file);
            body.append('folder', folder);
            try {
                const { data } = await api.post('/admin/uploads', body);
                added.push(data.path);
            } catch (e) {
                toast.error(`${file.name}: ${e.fieldErrors?.file?.[0] || e.userMessage}`);
            }
        }
        onChange([...list, ...added]);
        setBusy(false);
    };

    return (
        <div>
            <div className="d-flex flex-wrap gap-2 mb-2">
                {list.map((p, i) => (
                    <div key={`${p}${i}`} className="position-relative">
                        <Img src={previewUrl(p)} alt="" className="rounded-3 object-cover border" style={{ width: 96, height: 72 }} />
                        <button type="button" className="btn btn-danger btn-sm rounded-circle position-absolute top-0 end-0 p-0" style={{ width: 22, height: 22, transform: 'translate(30%,-30%)' }} onClick={() => onChange(list.filter((_, j) => j !== i))} aria-label="Remove image">
                            <i className="mdi mdi-close small" />
                        </button>
                        {i === 0 && <span className="badge text-bg-primary position-absolute bottom-0 start-0 m-1">Cover</span>}
                    </div>
                ))}
                <button type="button" className="upload-box d-flex flex-column align-items-center justify-content-center" style={{ width: 96, height: 72, padding: 0 }} onClick={() => ref.current.click()} disabled={busy}>
                    {busy ? <span className="spinner-border spinner-border-sm" /> : <><i className="mdi mdi-plus fs-4" /><small>Upload</small></>}
                </button>
            </div>
            <div className="input-group input-group-sm">
                <input className="form-control" placeholder="…or paste an image URL" value={url} onChange={(e) => setUrl(e.target.value)} />
                <button type="button" className="btn btn-outline-secondary" onClick={() => { if (url) { onChange([...list, url]); setUrl(''); } }}>Add URL</button>
            </div>
            <input type="file" accept="image/*" multiple hidden ref={ref} onChange={(e) => { upload([...e.target.files]); e.target.value = ''; }} />
        </div>
    );
}
