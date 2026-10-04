import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import AdSlot from '../components/ads/AdSlot';
import TourCard from '../components/cards/TourCard';
import { ErrorState, Spinner } from '../components/common/Feedback';
import Gallery from '../components/common/Gallery';
import { RatingBadge } from '../components/common/Stars';
import WishlistButton from '../components/common/WishlistButton';
import ReviewList from '../components/reviews/ReviewList';
import useApi from '../hooks/useApi';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { isoDate, money } from '../utils/format';
import { pushRecentlyViewed } from '../utils/viewer';

export default function TourDetail() {
    const { slug } = useParams();
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const [date, setDate] = useState(params.get('date') || isoDate(14));
    const [travellers, setTravellers] = useState(2);
    const { data, loading, error, reload } = useApi(`/tours/${slug}`, { date });
    const tour = data?.tour;
    useDocumentTitle(tour?.title);

    useEffect(() => {
        if (tour) pushRecentlyViewed({ type: 'tour', id: tour.id, name: tour.title, image: tour.thumbnail_url, url: `/tours/${tour.slug}` });
    }, [tour?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    if (loading && !data) return <Spinner className="py-5 min-vh-50" />;
    if (error) return <div className="container py-5"><ErrorState message={error} onRetry={reload} /></div>;
    if (!tour) return null;

    const spots = tour.spots_left ?? tour.max_group_size;
    const book = () => navigate(`/checkout?${new URLSearchParams({ service_type: 'tour', item_id: tour.id, start_date: date, quantity: travellers })}`);

    return (
        <div className="container py-4">
            <nav className="small mb-2"><Link to="/tours">Tours</Link> / <Link to={`/destinations/${tour.destination?.slug}`}>{tour.destination?.name}</Link></nav>
            <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
                <div>
                    <span className="badge text-bg-primary text-capitalize mb-2">{tour.category}</span>
                    <h1 className="h2 fw-800 mb-1">{tour.title}</h1>
                    <div className="text-soft"><i className="mdi mdi-map-marker-outline" /> {tour.destination?.name}, {tour.destination?.country} · <i className="mdi mdi-clock-outline" /> {tour.duration_days} days / {tour.duration_nights} nights</div>
                </div>
                <div className="d-flex align-items-center gap-3"><RatingBadge rating={tour.avg_rating} count={tour.reviews_count} /><WishlistButton type="tour" id={tour.id} /></div>
            </div>
            <Gallery images={tour.image_urls} alt={tour.title} />

            <div className="row g-4 mt-1">
                <div className="col-lg-8">
                    <div className="card border-0 p-4 mb-4">
                        <h5 className="fw-bold">Overview</h5>
                        <p className="text-soft">{tour.description}</p>
                        <div className="row g-3 text-center mt-1">
                            {[['mdi-clock-outline', `${tour.duration_days}D / ${tour.duration_nights}N`, 'Duration'], ['mdi-account-group-outline', `Max ${tour.max_group_size}`, 'Group size'], ['mdi-translate', 'English, Bangla', 'Guides'], ['mdi-shield-check-outline', '7 days', 'Free cancellation']].map(([icon, v, l]) => (
                                <div className="col-6 col-md-3" key={l}><div className="bg-body-tertiary rounded-4 p-3 h-100"><i className={`mdi ${icon} fs-3 text-primary`} /><div className="fw-bold small">{v}</div><div className="small text-soft">{l}</div></div></div>
                            ))}
                        </div>
                    </div>

                    <div className="card border-0 p-4 mb-4">
                        <h5 className="fw-bold mb-3">Itinerary</h5>
                        <div className="timeline">
                            {(tour.itinerary || []).map((d) => (
                                <div className="tl-item" key={d.day}>
                                    <div className="small text-primary fw-bold">Day {d.day}</div>
                                    <div className="fw-semibold">{d.title}</div>
                                    <div className="small text-soft">{d.description}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="row g-4 mb-4">
                        <div className="col-md-6"><div className="card border-0 p-4 h-100"><h6 className="fw-bold">What's included</h6>{(tour.inclusions || []).map((i) => <div key={i} className="small mb-1"><i className="mdi mdi-check-circle text-success me-2" />{i}</div>)}</div></div>
                        <div className="col-md-6"><div className="card border-0 p-4 h-100"><h6 className="fw-bold">Not included</h6>{(tour.exclusions || []).map((i) => <div key={i} className="small mb-1"><i className="mdi mdi-close-circle text-danger me-2" />{i}</div>)}</div></div>
                    </div>

                    <div className="card border-0 p-4 mb-4">
                        <h5 className="fw-bold mb-3">Reviews</h5>
                        <ReviewList type="tour" id={tour.id} avg={tour.avg_rating} count={tour.reviews_count} />
                    </div>
                </div>

                <div className="col-lg-4">
                    <div className="summary-sticky">
                        <div className="card border-0 p-4 mb-3">
                            <div className="small text-soft">From</div>
                            <div>
                                {tour.discount_price && <span className="strike me-2">{money(tour.price)}</span>}
                                <span className="price-tag fs-3 text-primary">{money(tour.effective_price)}</span> <span className="text-soft">/ person</span>
                            </div>
                            <div className="mt-3">
                                <label className="form-label" htmlFor="tour-date">Departure date</label>
                                <input id="tour-date" type="date" className="form-control" min={isoDate(1)} max={tour.available_to || undefined} value={date} onChange={(e) => setDate(e.target.value)} />
                                <div className={`small mt-1 ${spots < 5 ? 'text-danger' : 'text-success'}`}><i className="mdi mdi-account-check" /> {spots} spot{spots === 1 ? '' : 's'} left on this date</div>
                            </div>
                            <div className="mt-3">
                                <label className="form-label" htmlFor="travellers">Travellers</label>
                                <select id="travellers" className="form-select" value={travellers} onChange={(e) => setTravellers(Number(e.target.value))}>
                                    {Array.from({ length: Math.max(1, Math.min(10, spots)) }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n} traveller{n > 1 ? 's' : ''}</option>)}
                                </select>
                            </div>
                            <div className="d-flex justify-content-between fw-bold fs-5 mt-3"><span>Total</span><span className="text-primary">{money(tour.effective_price * travellers)}</span></div>
                            <button className="btn btn-gradient w-100 mt-3" disabled={spots < travellers} onClick={book}>Book this tour</button>
                        </div>
                        <AdSlot zone="detail_sidebar" />
                    </div>
                </div>
            </div>

            {data.similar?.length > 0 && (
                <section className="mt-2">
                    <h4 className="fw-bold mb-3">You may also like</h4>
                    <div className="row g-4">{data.similar.map((t) => <div className="col-md-4" key={t.id}><TourCard tour={t} /></div>)}</div>
                </section>
            )}
        </div>
    );
}
