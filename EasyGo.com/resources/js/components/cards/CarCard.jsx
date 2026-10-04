import { Link } from 'react-router-dom';
import { money } from '../../utils/format';
import Img from '../common/Img';
import Stars from '../common/Stars';
import WishlistButton from '../common/WishlistButton';

export default function CarCard({ car, query = '' }) {
    return (
        <Link to={`/cars/${car.id}${query}`} className="card listing-card card-hover border-0 text-reset text-decoration-none">
            <div className="thumb">
                <Img src={car.thumbnail_url} alt={car.name} />
                <span className="badge-float badge text-bg-dark text-capitalize">{car.car_type}</span>
                <WishlistButton type="car" id={car.id} />
            </div>
            <div className="card-body d-flex flex-column">
                <h6 className="fw-bold mb-1">{car.name}</h6>
                <div className="small text-soft mb-2"><i className="mdi mdi-map-marker-outline" /> Pick-up in {car.destination?.name}</div>
                <div className="d-flex flex-wrap gap-3 small text-soft mb-2">
                    <span><i className="mdi mdi-seat-passenger" /> {car.seats}</span>
                    <span><i className="mdi mdi-bag-suitcase-outline" /> {car.bags}</span>
                    <span className="text-capitalize"><i className="mdi mdi-car-shift-pattern" /> {car.transmission}</span>
                    <span className="text-capitalize"><i className="mdi mdi-gas-station-outline" /> {car.fuel_type}</span>
                </div>
                {car.with_driver && <span className="badge text-bg-success align-self-start mb-2"><i className="mdi mdi-account-tie" /> With driver</span>}
                <div className="d-flex align-items-center gap-1 small"><Stars value={car.avg_rating} size=".8rem" /> <span className="text-soft">({car.reviews_count})</span></div>
                <div className="mt-auto pt-3 d-flex justify-content-between align-items-end">
                    {car.available === false ? <span className="badge text-bg-danger">Unavailable</span> : <span className="small text-soft">per day</span>}
                    <span className="price-tag text-primary">{money(car.price_per_day)}</span>
                </div>
            </div>
        </Link>
    );
}
