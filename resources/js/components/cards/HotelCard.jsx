import { Link } from 'react-router-dom';
import { money } from '../../utils/format';
import Img from '../common/Img';
import Stars, { RatingBadge } from '../common/Stars';
import WishlistButton from '../common/WishlistButton';

/** Grid card for a hotel. `query` carries search dates into the detail page. */
export default function HotelCard({ hotel, query = '' }) {
    const soldOut = hotel.available === false;
    return (
        <Link to={`/hotels/${hotel.slug}${query}`} className="card listing-card card-hover border-0 text-reset text-decoration-none">
            <div className="thumb">
                <Img src={hotel.thumbnail_url} alt={hotel.name} />
                {hotel.is_featured && <span className="badge-float badge bg-warning text-dark"><i className="mdi mdi-crown" /> Featured</span>}
                <WishlistButton type="hotel" id={hotel.id} />
            </div>
            <div className="card-body d-flex flex-column">
                <div className="d-flex justify-content-between align-items-center mb-1">
                    <Stars value={hotel.star_rating} size=".8rem" />
                    <span className="badge text-bg-light text-capitalize">{hotel.property_type}</span>
                </div>
                <h6 className="fw-bold mb-1 text-truncate">{hotel.name}</h6>
                <div className="small text-soft mb-2 text-truncate"><i className="mdi mdi-map-marker-outline" /> {hotel.destination?.name}, {hotel.destination?.country}</div>
                <RatingBadge rating={hotel.avg_rating} count={hotel.reviews_count} />
                <div className="mt-auto pt-3 d-flex justify-content-between align-items-end">
                    {soldOut ? <span className="badge text-bg-danger">Sold out for your dates</span> : <span className="small text-soft">per night from</span>}
                    <span className="price-tag text-primary">{money(hotel.min_price)}</span>
                </div>
            </div>
        </Link>
    );
}
