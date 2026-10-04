import { useState } from 'react';
import useApi from '../../hooks/useApi';
import { toInputDateTime } from '../../utils/format';
import { GalleryInput, ImageInput } from './MediaInput';

/** Comma/Enter separated list of strings (amenities, inclusions, features…). */
function TagsInput({ value = [], onChange, placeholder }) {
    const [text, setText] = useState('');
    const list = value || [];
    const add = () => {
        const items = text.split(',').map((t) => t.trim()).filter(Boolean);
        if (items.length) onChange([...list, ...items.filter((i) => !list.includes(i))]);
        setText('');
    };
    return (
        <div className="form-control d-flex flex-wrap gap-1 align-items-center" style={{ minHeight: 44 }}>
            {list.map((t) => (
                <span key={t} className="badge text-bg-primary d-inline-flex align-items-center gap-1">
                    {t}<button type="button" className="btn-close btn-close-white" style={{ fontSize: '.5rem' }} onClick={() => onChange(list.filter((x) => x !== t))} aria-label={`Remove ${t}`} />
                </span>
            ))}
            <input className="border-0 flex-grow-1 bg-transparent" style={{ outline: 'none', minWidth: 120 }} value={text} placeholder={placeholder || 'Type and press Enter'}
                onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); } }} onBlur={add} />
        </div>
    );
}

/** Day-by-day tour itinerary editor. */
function ItineraryInput({ value = [], onChange }) {
    const list = value || [];
    const update = (i, k, v) => onChange(list.map((d, j) => (j === i ? { ...d, [k]: v } : d)));
    return (
        <div>
            {list.map((d, i) => (
                <div key={i} className="border rounded-3 p-2 mb-2">
                    <div className="d-flex gap-2 mb-1">
                        <span className="badge text-bg-primary align-self-center">Day {i + 1}</span>
                        <input className="form-control form-control-sm" placeholder="Title" value={d.title || ''} onChange={(e) => update(i, 'title', e.target.value)} />
                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => onChange(list.filter((_, j) => j !== i).map((x, j) => ({ ...x, day: j + 1 })))} aria-label="Remove day"><i className="mdi mdi-delete" /></button>
                    </div>
                    <textarea className="form-control form-control-sm" rows="2" placeholder="Description" value={d.description || ''} onChange={(e) => update(i, 'description', e.target.value)} />
                </div>
            ))}
            <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => onChange([...list, { day: list.length + 1, title: '', description: '' }])}><i className="mdi mdi-plus" /> Add day</button>
        </div>
    );
}

/** <select> whose options come from an admin endpoint (e.g. destinations). */
function AsyncSelect({ endpoint, labelKey = 'name', value, onChange, required }) {
    const { data } = useApi(endpoint, { per_page: 100, sort: labelKey, direction: 'asc' });
    return (
        <select className="form-select" value={value ?? ''} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')} required={required}>
            <option value="">— Select —</option>
            {(data?.data || []).map((o) => <option key={o.id} value={o.id}>{o[labelKey]}</option>)}
        </select>
    );
}

/**
 * Renders one field from a resource config:
 * text | email | number | password | textarea | select | async-select | switch | date | datetime | time
 * | image | gallery | tags | checklist | itinerary
 */
export default function FormField({ field, value, onChange, error }) {
    const { type = 'text', label, help, required, options = [], placeholder } = field;
    const id = `f-${field.name}`;
    let input;

    switch (type) {
        case 'textarea':
            input = <textarea id={id} className={`form-control ${error ? 'is-invalid' : ''}`} rows={field.rows || 4} value={value ?? ''} onChange={(e) => onChange(e.target.value)} required={required} placeholder={placeholder} />;
            break;
        case 'select':
            input = (
                <select id={id} className={`form-select ${error ? 'is-invalid' : ''}`} value={value ?? ''} onChange={(e) => onChange(e.target.value)} required={required}>
                    {!required && <option value="">—</option>}
                    {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
            );
            break;
        case 'async-select':
            input = <AsyncSelect endpoint={field.endpoint} labelKey={field.labelKey} value={value} onChange={onChange} required={required} />;
            break;
        case 'switch':
            input = (
                <div className="form-check form-switch">
                    <input id={id} className="form-check-input" type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
                    <label className="form-check-label" htmlFor={id}>{field.switchLabel || 'Enabled'}</label>
                </div>
            );
            break;
        case 'datetime':
            input = <input id={id} type="datetime-local" className={`form-control ${error ? 'is-invalid' : ''}`} value={value && value.length > 16 ? toInputDateTime(value) : value ?? ''} onChange={(e) => onChange(e.target.value)} required={required} />;
            break;
        case 'date':
            input = <input id={id} type="date" className={`form-control ${error ? 'is-invalid' : ''}`} value={(value ?? '').slice(0, 10)} onChange={(e) => onChange(e.target.value)} required={required} />;
            break;
        case 'image':
            input = <ImageInput value={value} onChange={onChange} folder={field.folder} />;
            break;
        case 'gallery':
            input = <GalleryInput value={value} onChange={onChange} folder={field.folder} />;
            break;
        case 'tags':
            input = <TagsInput value={value} onChange={onChange} placeholder={placeholder} />;
            break;
        case 'itinerary':
            input = <ItineraryInput value={value} onChange={onChange} />;
            break;
        case 'checklist':
            input = (
                <div className="row g-1">
                    {options.map(([v, l]) => (
                        <div className="col-6 col-md-4" key={v}>
                            <div className="form-check">
                                <input className="form-check-input" type="checkbox" id={`${id}-${v}`} checked={(value || []).includes(v)}
                                    onChange={(e) => onChange(e.target.checked ? [...(value || []), v] : (value || []).filter((x) => x !== v))} />
                                <label className="form-check-label small" htmlFor={`${id}-${v}`}>{l}</label>
                            </div>
                        </div>
                    ))}
                </div>
            );
            break;
        default:
            input = (
                <input id={id} type={type} step={type === 'number' ? field.step || 'any' : undefined} className={`form-control ${error ? 'is-invalid' : ''}`}
                    value={value ?? ''} onChange={(e) => onChange(e.target.value)} required={required} placeholder={placeholder} min={field.min} max={field.max} />
            );
    }

    return (
        <div className={field.col || 'col-12'}>
            {type !== 'switch' || field.showLabel ? <label className="form-label" htmlFor={id}>{label}{required && <span className="text-danger"> *</span>}</label> : null}
            {type === 'switch' && !field.showLabel && <div className="form-label">{label}</div>}
            {input}
            {error && <div className="invalid-feedback d-block">{error}</div>}
            {help && <div className="form-text">{help}</div>}
        </div>
    );
}
