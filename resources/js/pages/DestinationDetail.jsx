import { useParams } from 'react-router-dom';
import CarCard from '../components/cards/CarCard';
import HotelCard from '../components/cards/HotelCard';
import TourCard from '../components/cards/TourCard';
import { ErrorState, Spinner } from '../components/common/Feedback';
import SectionHeader from '../components/common/SectionHeader';
import useApi from '../hooks/useApi';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function DestinationDetail() {
    const { slug } = useParams();
    const { data, loading, error } = useApi(`/destinations/${slug}`);
    useDocumentTitle(data?.destination?.name);

    if (loading) return <Spinner className="py-5 min-vh-50" />;
    if (error) return <div className="container py-5"><ErrorState message={error} /></div>;
    const d = data.destination;

    return (
        <>
            <section className="hero" style={{ backgroundImage: `url(${d.image_url})`, minHeight: 460 }}>
                <div className="container">
                    <div className="small opacity-75"><i className="mdi mdi-map-marker" /> {d.country}</div>
                    <h1>{d.name}</h1>
                    <p className="lead opacity-75" style={{ maxWidth: 640 }}>{d.tagline}</p>
                </div>
            </section>
            <div className="container py-5">
                <p className="lead text-soft mb-5" style={{ maxWidth: 820 }}>{d.description}</p>
                {data.hotels.length > 0 && (
                    <section className="mb-5">
                        <SectionHeader title={`Where to stay in ${d.name}`} link={`/hotels?q=${encodeURIComponent(d.name)}`} />
                        <div className="row g-4">{data.hotels.map((h) => <div className="col-sm-6 col-lg-3" key={h.id}><HotelCard hotel={h} /></div>)}</div>
                    </section>
                )}
                {data.tours.length > 0 && (
                    <section className="mb-5">
                        <SectionHeader title="Tours & experiences" link={`/tours?q=${encodeURIComponent(d.name)}`} />
                        <div className="row g-4">{data.tours.map((t) => <div className="col-md-6 col-lg-4" key={t.id}><TourCard tour={t} /></div>)}</div>
                    </section>
                )}
                {data.cars.length > 0 && (
                    <section>
                        <SectionHeader title="Get around" link={`/cars?location=${encodeURIComponent(d.name)}`} />
                        <div className="row g-4">{data.cars.map((c) => <div className="col-sm-6 col-lg-3" key={c.id}><CarCard car={c} /></div>)}</div>
                    </section>
                )}
            </div>
        </>
    );
}
