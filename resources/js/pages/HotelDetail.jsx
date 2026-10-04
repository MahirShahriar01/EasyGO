import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import AdSlot from '../components/ads/AdSlot';
import HotelCard from '../components/cards/HotelCard';
import { ErrorState, Spinner } from '../components/common/Feedback';
import Gallery from '../components/common/Gallery';
import Img from '../components/common/Img';
import Stars, { RatingBadge } from '../components/common/Stars';
import WishlistButton from '../components/common/WishlistButton';
import ReviewList from '../components/reviews/ReviewList';
import useApi from '../hooks/useApi';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { isoDate, money, nightsBetween } from '../utils/format';
import { pushRecentlyViewed } from '../utils/viewer';

const AMENITY_ICON = {
    wifi: 'mdi-wifi', pool: 'mdi-pool', parking: 'mdi-parking', spa: 'mdi-spa', gym: 'mdi-dumbbell', restaurant: 'mdi-silverware-fork-knife',
    bar: 'mdi-glass-cocktail', ac: 'mdi-air-conditioner', airport_shuttle: 'mdi-airport', room_service: 'mdi-room-service',
    beach: 'mdi-beach', pet_friendly: 'mdi-paw', family_rooms: 'mdi-human-male-female-child', breakfast: 'mdi-coffee',
};

export default function HotelDetail() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();
    const [stay, setStay] = useState({
        check_in: params.get('check_in') || isoDate(7),
        check_out: params.get('check_out') || isoDate(9),
        adults: params.get('adults') || '2',
        children: params.get('children') || '0',
    });
    const [rooms, setRooms] = useState({});
    const { data, loading, error, reload } = useApi(`/hotels/${slug}`, { check_in: params.get('check_in') || stay.check_in, check_out: params.get('check_out') || stay.check_out });
    const hotel = data?.hotel;
    useDocumentTitle(hotel?.name);

    useEffect(() => {
        if (hotel) pushRecentlyViewed({ type: 'hotel', id: hotel.id, name: hotel.name, image: hotel.thumbnail_url, url: `/hotels/${hotel.slug}` });
    }, [hotel]);

    if (loading && !data) return <Spinner className="min-vh-50 py-5" />;
    if (error) return <div className="container py-5"><ErrorState message={error} onRetry={reload} /></div>;
    if (!hotel) return null;

    const nights = nightsBetween(stay.check_in, stay.check_out);
    const applyDates = (e) => {
        e.preventDefault();
        setParams({ ...Object.fromEntries(params), ...stay });
    };

    const reserve = (room) => {
        const qty = rooms[room.id] || 1;
        const qs = new URLSearchParams({ service_type: 'hotel', item_id: room.id, start_date: stay.check_in, end_date: stay.check_out, quantity: qty, adults: stay.adults, children: stay.children });
        navigate(`/checkout?${qs}`);
    };

    const mapSrc = hotel.latitude
        ? `https://www.openstreetmap.org/export/embed.html?bbox=${hotel.longitude - 0.02},${hotel.latitude - 0.012},${hotel.longitude + 0.02},${hotel.latitude + 0.012}&layer=mapnik&marker=${hotel.latitude},${hotel.longitude}`
        : null;

    return (
        <div className="container py-4">
            <nav aria-label="breadcrumb" className="small mb-2">
                <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item"><Link to="/">Home</Link></li>
                    <li className="breadcrumb-item"><Link to="/hotels">Hotels</Link></li>
                    <li className="breadcrumb-item"><Link to={`/destinations/${hotel.destination?.slug}`}>{hotel.destination?.name}</Link></li>
                    <li className="breadcrumb-item active">{hotel.name}</li>
                </ol>
            </nav>

            <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
                <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                        <Stars value={hotel.star_rating} />
                        <span className="badge text-bg-light text-capitalize">{hotel.property_type}</span>
                        {hotel.is_featured && <span className="badge bg-warning text-dark"><i className="mdi mdi-crown" /> Featured</span>}
                    </div>
                    <h1 className="h2 fw-800 mb-1">{hotel.name}</h1>
                    <div className="text-soft"><i className="mdi mdi-map-marker-outline" /> {hotel.address}</div>
                </div>
                <div className="d-flex align-items-center gap-3">
                    <RatingBadge rating={hotel.avg_rating} count={hotel.reviews_count} />
                    <WishlistButton type="hotel" id={hotel.id} className="wish-btn" />
                    <button className="btn btn-light btn-icon" onClick={() => navigator.share?.({ title: hotel.name, url: window.location.href }) ?? navigator.clipboard?.writeText(window.location.href)} aria-label="Share"><i className="mdi mdi-share-variant" /></button>
                </div>
            </div>

            <Gallery images={hotel.image_urls} alt={hotel.name} />

            <div className="row g-4 mt-1">
                <div className="col-lg-8">
                    <div className="card border-0 p-4 mb-4">
                        <h5 className="fw-bold">About this property</h5>
                        <p className="text-soft mb-4" style={{ whiteSpace: 'pre-line' }}>{hotel.description}</p>
                        <h6 className="fw-bold mb-3">Popular amenities</h6>
                        <div className="row g-2">
                            {(hotel.amenities || []).map((a) => (
                                <div className="col-6 col-md-4" key={a}><i className={`mdi ${AMENITY_ICON[a] || 'mdi-check'} text-primary me-2`} />{data.amenity_labels?.[a] || a}</div>
                            ))}
                        </div>
                    </div>

                    {/* Availability & rooms ------------------------------------------------ */}
                    <div className="card border-0 p-4 mb-4" id="rooms">
                        <h5 className="fw-bold mb-3">Availability</h5>
                        <form className="row g-2 mb-4" onSubmit={applyDates}>
                            <div className="col-md-3"><label className="form-label">Check-in</label><input type="date" className="form-control" min={isoDate(0)} value={stay.check_in} onChange={(e) => setStay({ ...stay, check_in: e.target.value })} /></div>
                            <div className="col-md-3"><label className="form-label">Check-out</label><input type="date" className="form-control" min={stay.check_in} value={stay.check_out} onChange={(e) => setStay({ ...stay, check_out: e.target.value })} /></div>
                            <div className="col-md-2"><label className="form-label">Adults</label><select className="form-select" value={stay.adults} onChange={(e) => setStay({ ...stay, adults: e.target.value })}>{[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <option key={n}>{n}</option>)}</select></div>
                            <div className="col-md-2"><label className="form-label">Children</label><select className="form-select" value={stay.children} onChange={(e) => setStay({ ...stay, children: e.target.value })}>{[0, 1, 2, 3, 4].map((n) => <option key={n}>{n}</option>)}</select></div>
                            <div className="col-md-2 d-grid align-items-end"><button className="btn btn-primary mt-md-4">Update</button></div>
                        </form>

                        {hotel.room_types.map((room) => {
                            const soldOut = room.available_rooms < 1;
                            return (
                                <div key={room.id} className="border rounded-4 p-3 mb-3">
                                    <div className="row g-3 align-items-center">
                                        <div className="col-md-3"><Img src={room.image_urls[0]} alt={room.name} className="w-100 rounded-3 object-cover" style={{ height: 120 }} /></div>
                                        <div className="col-md-5">
                                            <h6 className="fw-bold mb-1">{room.name}</h6>
                                            <div className="small text-soft mb-2">
                                                <i className="mdi mdi-bed-outline" /> {room.bed_type} · <i className="mdi mdi-floor-plan" /> {room.size_sqm} m² · <i className="mdi mdi-account-multiple-outline" /> {room.max_adults} adults{room.max_children ? ` + ${room.max_children} child` : ''}
                                            </div>
                                            <div className="d-flex flex-wrap gap-2 small">
                                                {room.breakfast_included && <span className="text-success"><i className="mdi mdi-coffee" /> Breakfast included</span>}
                                                <span className={room.refundable ? 'text-success' : 'text-danger'}><i className={`mdi ${room.refundable ? 'mdi-check-circle' : 'mdi-close-circle'}`} /> {room.refundable ? 'Free cancellation (24h)' : 'Non-refundable'}</span>
                                            </div>
                                            {!soldOut && room.available_rooms <= 3 && <div className="small text-danger fw-semibold mt-1"><i className="mdi mdi-fire" /> Only {room.available_rooms} left!</div>}
                                        </div>
                                        <div className="col-md-4 text-md-end">
                                            <div className="price-tag text-primary">{money(room.price_per_night)}</div>
                                            <div className="small text-soft mb-2">per night{nights > 0 ? ` · ${money(room.price_per_night * nights)} for ${nights} night${nights > 1 ? 's' : ''}` : ''}</div>
                                            {soldOut ? <span className="badge text-bg-danger">Sold out for these dates</span> : (
                                                <div className="d-flex gap-2 justify-content-md-end">
                                                    <select className="form-select form-select-sm w-auto" value={rooms[room.id] || 1} onChange={(e) => setRooms({ ...rooms, [room.id]: Number(e.target.value) })} aria-label="Rooms">
                                                        {Array.from({ length: Math.min(5, room.available_rooms) }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n} room{n > 1 ? 's' : ''}</option>)}
                                                    </select>
                                                    <button className="btn btn-gradient btn-sm px-3" onClick={() => reserve(room)} disabled={nights < 1}>Reserve</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="card border-0 p-4 mb-4">
                        <h5 className="fw-bold mb-3">House rules & policies</h5>
                        <div className="row g-3 mb-3">
                            <div className="col-6"><div className="small text-soft">Check-in</div><div className="fw-bold">From {hotel.check_in_time}</div></div>
                            <div className="col-6"><div className="small text-soft">Check-out</div><div className="fw-bold">Until {hotel.check_out_time}</div></div>
                        </div>
                        <p className="text-soft mb-0" style={{ whiteSpace: 'pre-line' }}>{hotel.policies}</p>
                    </div>

                    <div className="card border-0 p-4 mb-4">
                        <h5 className="fw-bold mb-3">Guest reviews</h5>
                        <ReviewList type="hotel" id={hotel.id} avg={hotel.avg_rating} count={hotel.reviews_count} breakdown={data.rating_breakdown} />
                    </div>
                </div>

                <div className="col-lg-4">
                    <div className="summary-sticky">
                        <div className="card border-0 p-4 mb-3">
                            <div className="small text-soft">Prices from</div>
                            <div className="price-tag fs-3 text-primary">{money(hotel.min_price)} <span className="fs-6 text-soft fw-normal">/ night</span></div>
                            <a href="#rooms" className="btn btn-gradient w-100 mt-3">See available rooms</a>
                            <hr />
                            <div className="small d-grid gap-2">
                                {hotel.phone && <span><i className="mdi mdi-phone-outline me-2" />{hotel.phone}</span>}
                                {hotel.email && <span><i className="mdi mdi-email-outline me-2" />{hotel.email}</span>}
                            </div>
                        </div>
                        {mapSrc && (
                            <div className="card border-0 overflow-hidden mb-3">
                                <iframe title="Map" src={mapSrc} style={{ border: 0, width: '100%', height: 220 }} loading="lazy" />
                            </div>
                        )}
                        <AdSlot zone="detail_sidebar" />
                    </div>
                </div>
            </div>

            {data.similar?.length > 0 && (
                <section className="mt-4">
                    <h4 className="fw-bold mb-3">More stays in {hotel.destination?.name}</h4>
                    <div className="row g-4">{data.similar.map((h) => <div className="col-sm-6 col-lg-3" key={h.id}><HotelCard hotel={h} /></div>)}</div>
                </section>
            )}
        </div>
    );
}
