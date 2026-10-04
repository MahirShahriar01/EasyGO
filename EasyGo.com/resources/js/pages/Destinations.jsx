import { useState } from 'react';
import DestinationCard from '../components/cards/DestinationCard';
import { CardSkeleton } from '../components/common/Feedback';
import useApi from '../hooks/useApi';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function Destinations() {
    useDocumentTitle('Destinations');
    const { data, loading } = useApi('/destinations');
    const [country, setCountry] = useState('');
    const countries = [...new Set((data || []).map((d) => d.country))];
    const list = (data || []).filter((d) => !country || d.country === country);

    return (
        <>
            <section className="hero hero-sm bg-gradient-brand" style={{ backgroundImage: 'none' }}>
                <div className="container">
                    <h1 className="h2 fw-800">Explore destinations</h1>
                    <p className="opacity-75 mb-0">From the beaches of Cox's Bazar to the lagoons of the Maldives.</p>
                </div>
            </section>
            <div className="container py-5">
                <div className="d-flex flex-wrap gap-2 mb-4">
                    <span className={`chip ${!country ? 'active' : ''}`} onClick={() => setCountry('')}>All</span>
                    {countries.map((c) => <span key={c} className={`chip ${country === c ? 'active' : ''}`} onClick={() => setCountry(c)}>{c}</span>)}
                </div>
                <div className="row g-3">
                    {loading && <CardSkeleton count={8} />}
                    {list.map((d) => <div className="col-6 col-md-4 col-lg-3" key={d.id}><DestinationCard destination={d} /></div>)}
                </div>
            </div>
        </>
    );
}
