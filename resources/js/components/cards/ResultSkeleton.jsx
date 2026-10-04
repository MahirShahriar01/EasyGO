import { Skeleton } from '../common/Feedback';

/** Placeholder rows for list-style results (flights, buses). */
export default function ResultSkeleton({ rows = 4 }) {
    return Array.from({ length: rows }).map((_, i) => (
        <div className="card border-0 mb-3" key={i}>
            <div className="card-body d-flex gap-4 align-items-center">
                <Skeleton height={48} width={48} />
                <div className="flex-grow-1"><Skeleton height={18} width="60%" className="mb-2" /><Skeleton height={14} width="40%" /></div>
                <Skeleton height={36} width={110} />
            </div>
        </div>
    ));
}
