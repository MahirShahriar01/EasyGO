import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import AdSlot from '../components/ads/AdSlot';
import { ErrorState, Spinner } from '../components/common/Feedback';
import Gallery from '../components/common/Gallery';
import { RatingBadge } from '../components/common/Stars';
import WishlistButton from '../components/common/WishlistButton';
import ReviewList from '../components/reviews/ReviewList';
import useApi from '../hooks/useApi';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { isoDate, money, nightsBetween } from '../utils/format';
import { pushRecentlyViewed } from '../utils/viewer';

export default function CarDetail() {
    const { id } = useParams();
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const [range, setRange] = useState({ pickup_date: params.get('pickup_date') || isoDate(2), dropoff_date: params.get('dropoff_date') || isoDate(5) });
    const [qty, setQty] = useState(1);
    const { data, loading, error, reload } = useApi(`/cars/${id}`, range);
    const car = data?.car;
    useDocumentTitle(car?.name);

    useEffect(() => {
        if (car) pushRecentlyViewed({ type: 'car', id: car.id, name: car.name, image: car.thumbnail_url, url: `/cars/${car.id}` });
    }, [car?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    if (loading && !data) return <Spinner className="py-5 min-vh-50" />;
    if (error) return <div className="container py-5"><ErrorState message={error} onRetry={reload} /></div>;
    if (!car) return null;

    const days = nightsBetween(range.pickup_date, range.dropoff_date);
    const available = car.available_units ?? car.quantity;
    const book = () => navigate(`/checkout?${new URLSearchParams({ service_type: 'car', item_id: car.id, start_date: range.pickup_date, end_date: range.dropoff_date, quantity: qty })}`);

    return (
        <div className="container py-4">
            <nav className="small mb-2"><Link to="/cars">Car rental</Link> / {car.destination?.name}</nav>
            <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
                <div>
                    <span className="badge text-bg-dark text-capitalize mb-2">{car.car_type}</span>
                    <h1 className="h2 fw-800 mb-1">{car.name}</h1>
                    <div className="text-soft"><i className="mdi mdi-map-marker-outline" /> Pick-up & return in {car.destination?.name}</div>
                </div>
                <div className="d-flex align-items-center gap-3"><RatingBadge rating={car.avg_rating} count={car.reviews_count} /><WishlistButton type="car" id={car.id} /></div>
            </div>
            <Gallery images={car.image_urls} alt={car.name} />
            <div className="row g-4 mt-1">
                <div className="col-lg-8">
                    <div className="card border-0 p-4 mb-4">
                        <h5 className="fw-bold mb-3">Specifications</h5>
                        <div className="row g-3 text-center">
                            {[['mdi-seat-passenger', `${car.seats} seats`], ['mdi-bag-suitcase-outline', `${car.bags} bags`], ['mdi-car-shift-pattern', car.transmission], ['mdi-gas-station-outline', car.fuel_type], ['mdi-air-conditioner', car.air_conditioning ? 'A/C' : 'No A/C'], ['mdi-account-tie', car.with_driver ? 'With driver' : 'Self drive']].map(([icon, label]) => (
                                <div className="col-4 col-md-2" key={icon}><div className="bg-body-tertiary rounded-4 p-3"><i className={`mdi ${icon} fs-3 text-primary`} /><div className="small fw-semibold text-capitalize">{label}</div></div></div>
                            ))}
                        </div>
                        <h6 className="fw-bold mt-4">Features</h6>
                        <div className="d-flex flex-wrap gap-2">{(car.features || []).map((f) => <span key={f} className="badge text-bg-light"><i className="mdi mdi-check" /> {f}</span>)}</div>
                        <h6 className="fw-bold mt-4">Rental terms</h6>
                        <ul className="small text-soft mb-0">
                            <li>Valid driving licence and NID / passport required{car.with_driver ? ' (not needed — driver included)' : ''}.</li>
                            <li>Fuel policy: return with the same level.</li>
                            <li>Free cancellation up to 24 hours before pick-up.</li>
                        </ul>
                    </div>
                    <div className="card border-0 p-4 mb-4">
                        <h5 className="fw-bold mb-3">Reviews</h5>
                        <ReviewList type="car" id={car.id} avg={car.avg_rating} count={car.reviews_count} />
                    </div>
                </div>
                <div className="col-lg-4">
                    <div className="summary-sticky">
                        <div className="card border-0 p-4 mb-3">
                            <div className="price-tag fs-3 text-primary">{money(car.price_per_day)} <span className="fs-6 text-soft fw-normal">/ day</span></div>
                            <div className="row g-2 mt-2">
                                <div className="col-6"><label className="form-label">Pick-up</label><input type="date" className="form-control" min={isoDate(0)} value={range.pickup_date} onChange={(e) => setRange({ ...range, pickup_date: e.target.value })} /></div>
                                <div className="col-6"><label className="form-label">Drop-off</label><input type="date" className="form-control" min={range.pickup_date} value={range.dropoff_date} onChange={(e) => setRange({ ...range, dropoff_date: e.target.value })} /></div>
                            </div>
                            <div className="mt-2">
                                <label className="form-label">Cars</label>
                                <select className="form-select" value={qty} onChange={(e) => setQty(Number(e.target.value))}>
                                    {Array.from({ length: Math.max(1, Math.min(5, available)) }, (_, i) => i + 1).map((n) => <option key={n}>{n}</option>)}
                                </select>
                                <div className={`small mt-1 ${available ? 'text-success' : 'text-danger'}`}>{available ? `${available} available for these dates` : 'Not available for these dates'}</div>
                            </div>
                            <div className="d-flex justify-content-between fw-bold fs-5 mt-3"><span>{days} day{days === 1 ? '' : 's'}</span><span className="text-primary">{money(car.price_per_day * days * qty)}</span></div>
                            <button className="btn btn-gradient w-100 mt-3" disabled={!available || days < 1} onClick={book}>Reserve car</button>
                        </div>
                        <AdSlot zone="detail_sidebar" />
                    </div>
                </div>
            </div>
        </div>
    );
}
