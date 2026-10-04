/** Pagination for Laravel LengthAwarePaginator responses. */
export default function Pagination({ meta, onPage, className = '' }) {
    if (!meta || meta.last_page <= 1) return null;
    const { current_page: page, last_page: last } = meta;
    const pages = [];
    for (let p = Math.max(1, page - 2); p <= Math.min(last, page + 2); p++) pages.push(p);

    const Item = ({ p, label, disabled, active }) => (
        <li className={`page-item ${disabled ? 'disabled' : ''} ${active ? 'active' : ''}`}>
            <button type="button" className="page-link" onClick={() => onPage(p)} disabled={disabled}>{label ?? p}</button>
        </li>
    );

    return (
        <nav className={`d-flex flex-wrap justify-content-between align-items-center gap-2 ${className}`}>
            <span className="small text-soft">Showing {meta.from}–{meta.to} of {meta.total}</span>
            <ul className="pagination pagination-sm mb-0">
                <Item p={page - 1} label={<i className="mdi mdi-chevron-left" />} disabled={page === 1} />
                {pages[0] > 1 && <><Item p={1} />{pages[0] > 2 && <Item label="…" disabled />}</>}
                {pages.map((p) => <Item key={p} p={p} active={p === page} />)}
                {pages[pages.length - 1] < last && <>{pages[pages.length - 1] < last - 1 && <Item label="…" disabled />}<Item p={last} /></>}
                <Item p={page + 1} label={<i className="mdi mdi-chevron-right" />} disabled={page === last} />
            </ul>
        </nav>
    );
}
