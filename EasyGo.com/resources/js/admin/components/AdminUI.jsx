import { STATUS_BADGE, titleCase } from '../../utils/format';

export function StatusBadge({ value }) {
    if (value === undefined || value === null) return null;
    const v = typeof value === 'boolean' ? (value ? 'active' : 'inactive') : String(value);
    return <span className={`badge text-bg-${STATUS_BADGE[v] || 'secondary'} text-capitalize`}>{titleCase(v)}</span>;
}

export function PageHeader({ title, subtitle, icon, actions }) {
    return (
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
            <div className="d-flex align-items-center gap-3">
                {icon && <span className="feature-icon"><i className={`mdi ${icon}`} /></span>}
                <div>
                    <h1 className="h4 fw-800 mb-0">{title}</h1>
                    {subtitle && <div className="small text-soft">{subtitle}</div>}
                </div>
            </div>
            <div className="d-flex flex-wrap gap-2">{actions}</div>
        </div>
    );
}

export function KpiCard({ label, value, icon, color = 'primary', hint }) {
    return (
        <div className="card border-0 kpi-card h-100">
            <div className="card-body d-flex align-items-center gap-3">
                <span className={`kpi-icon bg-${color} bg-opacity-10 text-${color}`}><i className={`mdi ${icon}`} /></span>
                <div className="min-w-0">
                    <div className="small text-soft text-truncate">{label}</div>
                    <div className="fs-4 fw-800 lh-sm">{value}</div>
                    {hint && <div className="small">{hint}</div>}
                </div>
            </div>
        </div>
    );
}

/** Right-hand slide-over panel used for create/edit forms. */
export function SidePanel({ show, title, onClose, children, footer }) {
    if (!show) return null;
    return (
        <>
            <div className="offcanvas offcanvas-end show offcanvas-form" style={{ visibility: 'visible' }} role="dialog" aria-modal="true">
                <div className="offcanvas-header border-bottom">
                    <h5 className="offcanvas-title fw-bold">{title}</h5>
                    <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
                </div>
                <div className="offcanvas-body">{children}</div>
                {footer && <div className="border-top p-3 d-flex justify-content-end gap-2">{footer}</div>}
            </div>
            <div className="offcanvas-backdrop fade show" onClick={onClose} />
        </>
    );
}
