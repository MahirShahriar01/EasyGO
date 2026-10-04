import { Link } from 'react-router-dom';
import CarCard from '../../components/cards/CarCard';
import HotelCard from '../../components/cards/HotelCard';
import TourCard from '../../components/cards/TourCard';
import { EmptyState, Spinner } from '../../components/common/Feedback';
import useApi from '../../hooks/useApi';
import useDocumentTitle from '../../hooks/useDocumentTitle';

export default function Wishlist() {
    useDocumentTitle('Wishlist');
    const { data, loading } = useApi('/wishlist');

    return (
        <>
            <h1 className="h3 fw-800 mb-4">Wishlist</h1>
            {loading && <Spinner />}
            {data?.length === 0 && <div className="card border-0"><EmptyState icon="mdi-heart-outline" title="No saved items yet" text="Tap the heart on any hotel, tour or car to save it here." action={<Link to="/hotels" className="btn btn-gradient">Browse hotels</Link>} /></div>}
            <div className="row g-4">
                {data?.map((w) => (
                    <div className="col-md-6 col-xl-4" key={w.id}>
                        {w.type === 'hotel' && <HotelCard hotel={w.item} />}
                        {w.type === 'tour' && <TourCard tour={w.item} />}
                        {w.type === 'car' && <CarCard car={w.item} />}
                    </div>
                ))}
            </div>
        </>
    );
}
