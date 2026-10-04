import { useState } from 'react';
import useApi from '../../hooks/useApi';
import { date } from '../../utils/format';
import { Spinner } from '../common/Feedback';
import Pagination from '../common/Pagination';
import Stars, { RatingBadge } from '../common/Stars';

/** Approved guest reviews with a rating distribution summary. */
export default function ReviewList({ type, id, avg, count, breakdown = {} }) {
    const [page, setPage] = useState(1);
    const { data, loading } = useApi(`/reviews/${type}/${id}`, { page });

    return (
        <div>
            <div className="row g-4 align-items-center mb-4">
                <div className="col-md-4 text-center">
                    <div className="display-5 fw-800">{Number(avg || 0).toFixed(1)}</div>
                    <Stars value={avg} size="1.2rem" />
                    <div className="small text-soft mt-1">{count} verified review{count === 1 ? '' : 's'}</div>
                </div>
                <div className="col-md-8">
                    {[5, 4, 3, 2, 1].map((r) => {
                        const n = Number(breakdown?.[r] || 0);
                        return (
                            <div key={r} className="d-flex align-items-center gap-2 small mb-1">
                                <span style={{ width: 40 }}>{r} <i className="mdi mdi-star text-warning" /></span>
                                <div className="progress flex-grow-1" style={{ height: 8 }}><div className="progress-bar bg-warning" style={{ width: `${count ? (n / count) * 100 : 0}%` }} /></div>
                                <span className="text-soft" style={{ width: 28 }}>{n}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {loading && !data && <Spinner />}
            {data?.data?.length === 0 && <p className="text-soft">No reviews yet — be the first after your trip!</p>}
            {data?.data?.map((r) => (
                <div key={r.id} className="border-bottom py-3">
                    <div className="d-flex align-items-center gap-3 mb-2">
                        <img src={r.user?.avatar_url} alt="" width="40" height="40" className="rounded-circle object-cover" />
                        <div className="flex-grow-1">
                            <div className="fw-semibold">{r.user?.name} {r.user?.country && <span className="small text-soft">· {r.user.country}</span>}</div>
                            <div className="small text-soft">{date(r.created_at)} · <i className="mdi mdi-check-decagram text-success" /> Verified stay</div>
                        </div>
                        <RatingBadge rating={r.rating} count={1} />
                    </div>
                    {r.title && <div className="fw-bold">{r.title}</div>}
                    <p className="mb-0 text-soft">{r.comment}</p>
                </div>
            ))}
            <Pagination meta={data} onPage={setPage} className="mt-3" />
        </div>
    );
}
