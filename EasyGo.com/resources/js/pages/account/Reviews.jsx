import { EmptyState, Spinner } from '../../components/common/Feedback';
import Stars from '../../components/common/Stars';
import useApi from '../../hooks/useApi';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { date, STATUS_BADGE } from '../../utils/format';

export default function Reviews() {
    useDocumentTitle('My reviews');
    const { data, loading } = useApi('/my-reviews');

    return (
        <>
            <h1 className="h3 fw-800 mb-4">My reviews</h1>
            {loading && <Spinner />}
            {data?.data?.length === 0 && <div className="card border-0"><EmptyState icon="mdi-star-outline" title="No reviews yet" text="After a confirmed booking you can review it from the booking page." /></div>}
            {data?.data?.map((r) => (
                <div className="card border-0 p-4 mb-3" key={r.id}>
                    <div className="d-flex justify-content-between flex-wrap gap-2">
                        <div>
                            <div className="small text-soft text-capitalize">{r.reviewable_type}</div>
                            <div className="fw-bold">{r.reviewable?.name || r.reviewable?.title}</div>
                        </div>
                        <span className={`badge text-bg-${STATUS_BADGE[r.status]} text-capitalize align-self-start`}>{r.status}</span>
                    </div>
                    <div className="my-2"><Stars value={r.rating} /> <span className="small text-soft ms-2">{date(r.created_at)}</span></div>
                    {r.title && <div className="fw-semibold">{r.title}</div>}
                    <p className="text-soft mb-0">{r.comment}</p>
                </div>
            ))}
        </>
    );
}
