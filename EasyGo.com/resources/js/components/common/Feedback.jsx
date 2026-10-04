/** Loading, empty and error states shared across pages. */
export function Spinner({ className = 'py-5', label = 'Loading…' }) {
    return (
        <div className={`text-center ${className}`} role="status">
            <div className="spinner-border text-primary" />
            <div className="small text-soft mt-2">{label}</div>
        </div>
    );
}

export function Skeleton({ height = 16, width = '100%', className = '' }) {
    return <div className={`skeleton ${className}`} style={{ height, width }} />;
}

export function CardSkeleton({ count = 4, cols = 'col-sm-6 col-lg-3' }) {
    return Array.from({ length: count }).map((_, i) => (
        <div className={cols} key={i}>
            <div className="card border-0 h-100">
                <Skeleton height={190} className="rounded-top" />
                <div className="card-body">
                    <Skeleton height={18} width="70%" className="mb-2" />
                    <Skeleton height={14} width="45%" className="mb-3" />
                    <Skeleton height={22} width="35%" />
                </div>
            </div>
        </div>
    ));
}

export function EmptyState({ icon = 'mdi-magnify-close', title = 'Nothing here yet', text, action }) {
    return (
        <div className="empty-state">
            <i className={`mdi ${icon}`} />
            <h5 className="mt-3 fw-bold">{title}</h5>
            {text && <p className="text-soft mx-auto" style={{ maxWidth: 420 }}>{text}</p>}
            {action}
        </div>
    );
}

export function ErrorState({ message, onRetry }) {
    return (
        <div className="alert alert-danger d-flex align-items-center justify-content-between">
            <span><i className="mdi mdi-alert-circle-outline me-2" />{message || 'Something went wrong.'}</span>
            {onRetry && <button className="btn btn-sm btn-outline-danger" onClick={onRetry}>Retry</button>}
        </div>
    );
}
