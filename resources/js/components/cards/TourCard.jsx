import { Link } from 'react-router-dom';
import { money } from '../../utils/format';
import Img from '../common/Img';
import Stars from '../common/Stars';
import WishlistButton from '../common/WishlistButton';

export default function TourCard({ tour, query = '' }) {
    const discount = tour.discount_price && tour.discount_price < tour.price;
    return (
        <Link to={`/tours/${tour.slug}${query}`} className="card listing-card card-hover border-0 text-reset text-decoration-none">
            <div className="thumb">
                <Img src={tour.thumbnail_url} alt={tour.title} />
                {discount && <span className="badge-float badge bg-danger">-{Math.round((1 - tour.discount_price / tour.price) * 100)}% OFF</span>}
                <WishlistButton type="tour" id={tour.id} />
            </div>
            <div className="card-body d-flex flex-column">
                <div className="d-flex gap-2 small text-soft mb-1">
                    <span><i className="mdi mdi-clock-outline" /> {tour.duration_days}D/{tour.duration_nights}N</span>
                    <span><i className="mdi mdi-account-group-outline" /> Max {tour.max_group_size}</span>
                    {tour.category && <span className="text-capitalize"><i className="mdi mdi-tag-outline" /> {tour.category}</span>}
                </div>
                <h6 className="fw-bold mb-1">{tour.title}</h6>
                <div className="small text-soft mb-2"><i className="mdi mdi-map-marker-outline" /> {tour.destination?.name}</div>
                <div className="d-flex align-items-center gap-1 small"><Stars value={tour.avg_rating} size=".8rem" /> <span className="text-soft">({tour.reviews_count})</span></div>
                <div className="mt-auto pt-3 d-flex justify-content-between align-items-end">
                    <span className="small text-soft">per person</span>
                    <span>
                        {discount && <span className="strike me-2">{money(tour.price)}</span>}
                        <span className="price-tag text-primary">{money(tour.effective_price)}</span>
                    </span>
                </div>
            </div>
        </Link>
    );
}
