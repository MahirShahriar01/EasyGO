/** Read-only star rating (supports half values) or an interactive picker when `onChange` is given. */
export default function Stars({ value = 0, size = '1rem', onChange, className = '' }) {
    return (
        <span className={`stars ${className}`} style={{ fontSize: size }} aria-label={`${value} out of 5 stars`}>
            {[1, 2, 3, 4, 5].map((n) => {
                const icon = value >= n ? 'mdi-star' : value >= n - 0.5 ? 'mdi-star-half-full' : 'mdi-star-outline';
                return onChange ? (
                    <button key={n} type="button" className="btn btn-link p-0 stars" style={{ fontSize: size }} onClick={() => onChange(n)} aria-label={`${n} stars`}>
                        <i className={`mdi ${icon}`} />
                    </button>
                ) : <i key={n} className={`mdi ${icon}`} />;
            })}
        </span>
    );
}

/** "8.6 Excellent" style badge converted from a 5-point average. */
export function RatingBadge({ rating, count }) {
    if (!count) return <span className="badge text-bg-light">New</span>;
    const score = (Number(rating) * 2).toFixed(1);
    const label = score >= 9 ? 'Exceptional' : score >= 8 ? 'Excellent' : score >= 7 ? 'Very good' : score >= 6 ? 'Good' : 'Fair';
    return (
        <span className="d-inline-flex align-items-center gap-2">
            <span className="rating-pill">{score}</span>
            <span className="small"><strong>{label}</strong> <span className="text-soft">· {count} review{count === 1 ? '' : 's'}</span></span>
        </span>
    );
}
