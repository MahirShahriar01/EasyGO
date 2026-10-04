import { Link } from 'react-router-dom';
import Img from '../common/Img';

export default function DestinationCard({ destination }) {
    return (
        <Link to={`/destinations/${destination.slug}`} className="dest-card shadow-soft">
            <Img src={destination.image_url} alt={destination.name} />
            <div className="meta">
                <div className="small opacity-75"><i className="mdi mdi-map-marker" /> {destination.country}</div>
                <h5 className="fw-bold mb-1">{destination.name}</h5>
                <div className="small opacity-75">{destination.hotels_count ?? 0} stays · {destination.tours_count ?? 0} tours</div>
            </div>
        </Link>
    );
}
