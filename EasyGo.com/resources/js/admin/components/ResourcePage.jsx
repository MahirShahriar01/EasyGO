import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/client';
import { EmptyState, ErrorState } from '../../components/common/Feedback';
import { ConfirmModal } from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import useApi from '../../hooks/useApi';
import useDebounce from '../../hooks/useDebounce';
import { toInputDateTime } from '../../utils/format';
import FormField from './FormField';
import { PageHeader, SidePanel } from './AdminUI';

/**
 * Generic admin CRUD screen driven by a resource config (see admin/resources.jsx):
 * searchable, filterable, sortable paginated table + slide-over create/edit form
 * with server-side validation errors mapped onto fields.
 */
export default function ResourcePage({ config, fixed = {}, headerExtra }) {
    const [query, setQuery] = useState({ page: 1, sort: config.defaultSort || 'id', direction: 'desc', ...fixed });
    const [search, setSearch] = useState('');
    const q = useDebounce(search, 350);
    const params = useMemo(() => ({ ...query, q: q || undefined, per_page: 15 }), [query, q]);
    const { data, loading, error, reload } = useApi(config.endpoint, params);

    const [editing, setEditing] = useState(null); // null | {} (new) | row
    const [form, setForm] = useState({});
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(null);

    useEffect(() => { setQuery((s) => ({ ...s, page: 1 })); }, [q]);

    const open = (row) => {
        const base = { ...(config.defaults || {}), ...fixed };
        const values = {};
        config.fields.forEach((f) => {
            const v = row ? (row[f.name] ?? base[f.name] ?? '') : (base[f.name] ?? (f.type === 'switch' ? false : ''));
            // Timestamps arrive as ISO-UTC; edit them as wall-clock time in the platform timezone.
            values[f.name] = f.type === 'datetime' ? toInputDateTime(v) : v;
        });
        setForm(config.toForm ? config.toForm(values, row) : values);
        setErrors({});
        setEditing(row || {});
    };

    const save = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        // Empty strings become null so optional numeric/date fields validate as "nullable".
        const payload = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v === '' ? null : v]));
        try {
            const res = editing.id
                ? await api.put(`${config.endpoint}/${editing.id}`, payload)
                : await api.post(config.endpoint, payload);
            toast.success(res.data.message);
            setEditing(null);
            reload();
        } catch (err) {
            const mapped = {};
            Object.entries(err.fieldErrors || {}).forEach(([k, v]) => { mapped[k.split('.')[0]] ??= v[0]; });
            setErrors(mapped);
            toast.error(err.userMessage);
        } finally {
            setSaving(false);
        }
    };

    const destroy = async () => {
        try {
            const res = await api.delete(`${config.endpoint}/${deleting.id}`);
            toast.success(res.data.message);
            reload();
        } catch (err) {
            toast.error(err.userMessage);
        } finally {
            setDeleting(null);
        }
    };

    const sortBy = (key) => setQuery((s) => ({ ...s, sort: key, direction: s.sort === key && s.direction === 'desc' ? 'asc' : 'desc' }));

    return (
        <>
            <PageHeader
                title={config.title}
                subtitle={config.subtitle}
                icon={config.icon}
                actions={(
                    <>
                        {headerExtra}
                        {config.creatable !== false && <button className="btn btn-gradient" onClick={() => open(null)}><i className="mdi mdi-plus" /> New {config.singular}</button>}
                    </>
                )}
            />

            <div className="card border-0">
                <div className="card-body d-flex flex-wrap gap-2 border-bottom">
                    <div className="input-group" style={{ maxWidth: 320 }}>
                        <span className="input-group-text bg-transparent"><i className="mdi mdi-magnify" /></span>
                        <input className="form-control" placeholder={`Search ${config.title.toLowerCase()}…`} value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    {(config.filters || []).map((f) => (
                        <select key={f.key} className="form-select w-auto" value={query[f.key] ?? ''} onChange={(e) => setQuery((s) => ({ ...s, page: 1, [f.key]: e.target.value || undefined }))} aria-label={f.label}>
                            <option value="">{f.label}: all</option>
                            {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                    ))}
                </div>

                {error && <div className="p-3"><ErrorState message={error} onRetry={reload} /></div>}
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead>
                            <tr>
                                {config.columns.map((c) => (
                                    <th key={c.key} className={c.sortable ? 'cursor-pointer' : ''} onClick={() => c.sortable && sortBy(c.key)}>
                                        {c.label} {c.sortable && query.sort === c.key && <i className={`mdi mdi-arrow-${query.direction === 'asc' ? 'up' : 'down'}`} />}
                                    </th>
                                ))}
                                <th className="text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && !data && <tr><td colSpan={config.columns.length + 1} className="text-center py-5"><span className="spinner-border text-primary" /></td></tr>}
                            {data?.data?.map((row) => (
                                <tr key={row.id} style={{ opacity: loading ? 0.6 : 1 }}>
                                    {config.columns.map((c) => <td key={c.key}>{c.render ? c.render(row) : row[c.key]}</td>)}
                                    <td className="text-end text-nowrap">
                                        {config.rowActions?.(row, { reload })}
                                        <button className="btn btn-sm btn-light me-1" onClick={() => open(row)} title="Edit"><i className="mdi mdi-pencil" /></button>
                                        {config.deletable !== false && <button className="btn btn-sm btn-light text-danger" onClick={() => setDeleting(row)} title="Delete"><i className="mdi mdi-delete-outline" /></button>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {data?.data?.length === 0 && <EmptyState title={`No ${config.title.toLowerCase()} found`} />}
                <div className="card-body"><Pagination meta={data} onPage={(page) => setQuery((s) => ({ ...s, page }))} /></div>
            </div>

            <SidePanel
                show={editing !== null}
                title={editing?.id ? `Edit ${config.singular}` : `New ${config.singular}`}
                onClose={() => setEditing(null)}
                footer={(
                    <>
                        <button className="btn btn-light" onClick={() => setEditing(null)}>Cancel</button>
                        <button className="btn btn-gradient" form="resource-form" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
                    </>
                )}
            >
                <form id="resource-form" className="row g-3" onSubmit={save}>
                    {config.fields.filter((f) => !(f.name in fixed)).map((f) => (
                        <FormField key={f.name} field={f} value={form[f.name]} error={errors[f.name]} onChange={(v) => setForm((s) => ({ ...s, [f.name]: v }))} />
                    ))}
                </form>
            </SidePanel>

            <ConfirmModal
                show={Boolean(deleting)}
                onClose={() => setDeleting(null)}
                onConfirm={destroy}
                title={`Delete ${config.singular}?`}
                message={`“${deleting?.[config.labelKey || 'name'] ?? deleting?.id}” will be permanently removed.`}
                confirmLabel="Delete"
            />
        </>
    );
}
