import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import AdSlot from '../components/ads/AdSlot';
import CarCard from '../components/cards/CarCard';
import DestinationCard from '../components/cards/DestinationCard';
import HotelCard from '../components/cards/HotelCard';
import TourCard from '../components/cards/TourCard';
import { CardSkeleton } from '../components/common/Feedback';
import Img from '../components/common/Img';
import SectionHeader from '../components/common/SectionHeader';
import Stars from '../components/common/Stars';
import SearchWidget from '../components/search/SearchWidget';
import useApi from '../hooks/useApi';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { compact, date, duration, money, time, toInputDateTime } from '../utils/format';
import { recentlyViewed } from '../utils/viewer';

const WHY = [
    ['mdi-tag-heart-outline', 'Best price guarantee', 'Found it cheaper? We refund the difference.'],
    ['mdi-lightning-bolt-outline', 'Instant confirmation', 'E-tickets and vouchers in seconds.'],
    ['mdi-shield-check-outline', 'Secure payments', 'Cards, bKash, Nagad & Rocket — fully encrypted.'],
    ['mdi-headset', '24/7 support', 'Real humans, any time, any day.'],
];

export default function Home() {
    useDocumentTitle();
    const settings = useSelector((s) => s.settings);
    const { data, loading } = useApi('/home');
    const recent = recentlyViewed();

    return (
        <>
            {/* Hero + search ------------------------------------------------- */}
            <section className="hero" style={{ backgroundImage: `url(${settings.hero_image})` }}>
                <div className="container">
                    <div className="row justify-content-center text-center mb-4">
                        <div className="col-lg-9">
                            <span className="badge rounded-pill bg-white bg-opacity-25 px-3 py-2 mb-3 fw-semibold"><i className="mdi mdi-sparkles" /> Over {compact(data?.stats?.bookings ?? 48000)} trips booked</span>
                            <h1 className="mb-3">{settings.hero_title}</h1>
                            <p className="lead opacity-75 mb-0">{settings.hero_subtitle}</p>
                        </div>
                    </div>
                    <SearchWidget />
                    <div className="d-flex flex-wrap justify-content-center gap-4 mt-4 small fw-semibold opacity-75">
                        <span><i className="mdi mdi-check-circle" /> Free cancellation on many stays</span>
                        <span><i className="mdi mdi-check-circle" /> No hidden fees</span>
                        <span><i className="mdi mdi-check-circle" /> Pay with bKash / Nagad</span>
                    </div>
                </div>
            </section>

            <div className="container mt-5">
                <AdSlot zone="home_top_banner" />
            </div>

            {/* Destinations ---------------------------------------------------- */}
            <section className="section pb-4">
                <div className="container">
                    <SectionHeader eyebrow="Explore" title="Trending destinations" subtitle="Most-booked places by EasyGo travellers this month" link="/destinations" />
                    <div className="row g-3">
                        {loading && <CardSkeleton count={4} />}
                        {data?.destinations?.map((d) => <div className="col-6 col-md-4 col-lg-3" key={d.id}><DestinationCard destination={d} /></div>)}
                    </div>
                </div>
            </section>

            {/* Featured hotels ------------------------------------------------- */}
            <section className="section pt-4">
                <div className="container">
                    <SectionHeader eyebrow="Stay" title="Handpicked hotels & resorts" subtitle="Top-rated stays with great reviews and flexible cancellation" link="/hotels" />
                    <div className="row g-4">
                        {loading && <CardSkeleton count={4} />}
                        {data?.featured_hotels?.map((h) => <div className="col-sm-6 col-lg-3" key={h.id}><HotelCard hotel={h} /></div>)}
                    </div>
                </div>
            </section>

            <div className="container"><AdSlot zone="home_mid_banner" /></div>

            {/* Flight deals ------------------------------------------------------ */}
            {data?.flight_deals?.length > 0 && (
                <section className="section">
                    <div className="container">
                        <SectionHeader eyebrow="Fly" title="Cheapest flight deals" subtitle="Lowest fares departing soon" link="/flights" />
                        <div className="row g-3">
                            {data.flight_deals.map((f) => (
                                <div className="col-md-6 col-lg-3" key={f.id}>
                                    <Link to={`/flights?from=${encodeURIComponent(f.from_city)}&to=${encodeURIComponent(f.to_city)}&date=${toInputDateTime(f.departure_at).slice(0, 10)}`} className="card border-0 card-hover text-reset h-100">
                                        <div className="card-body">
                                            <div className="d-flex justify-content-between small text-soft mb-2"><span>{f.airline}</span><span>{date(f.departure_at, { day: 'numeric', month: 'short' })}</span></div>
                                            <div className="d-flex align-items-center justify-content-between">
                                                <div><div className="fs-4 fw-800">{f.from_code}</div><div className="small text-soft">{time(f.departure_at)}</div></div>
                                                <div className="text-center text-primary small"><i className="mdi mdi-airplane fs-4" /><div className="text-soft">{duration(f.duration_minutes)}</div></div>
                                                <div className="text-end"><div className="fs-4 fw-800">{f.to_code}</div><div className="small text-soft">{time(f.arrival_at)}</div></div>
                                            </div>
                                            <hr />
                                            <div className="d-flex justify-content-between align-items-center"><span className="small text-soft">from</span><span className="price-tag text-primary">{money(f.price)}</span></div>
                                        </div>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Tours ---------------------------------------------------------------- */}
            <section className="section bg-body-tertiary">
                <div className="container">
                    <SectionHeader eyebrow="Experience" title="Popular tour packages" subtitle="All-inclusive holidays curated by local experts" link="/tours" />
                    <div className="row g-4">
                        {loading && <CardSkeleton count={3} cols="col-md-6 col-lg-4" />}
                        {data?.featured_tours?.map((t) => <div className="col-md-6 col-lg-4" key={t.id}><TourCard tour={t} /></div>)}
                    </div>
                </div>
            </section>

            {/* Why us ----------------------------------------------------------------- */}
            <section className="section">
                <div className="container">
                    <div className="row g-4 align-items-center">
                        <div className="col-lg-5">
                            <div className="eyebrow mb-2">Why {settings.site_name}</div>
                            <h2 className="section-title mb-3">Everything you need for the perfect trip — in one app</h2>
                            <p className="text-soft mb-4">Compare and book hotels, flights, buses, tours and cars with transparent prices. Manage every booking, download invoices and get instant support from your account.</p>
                            <div className="row g-3 text-center">
                                {[[data?.stats?.hotels, 'Hotels'], [data?.stats?.destinations, 'Destinations'], [data?.stats?.travellers, 'Happy travellers']].map(([n, l]) => (
                                    <div className="col-4" key={l}><div className="fs-3 fw-800 text-gradient">{compact(n)}+</div><div className="small text-soft">{l}</div></div>
                                ))}
                            </div>
                        </div>
                        <div className="col-lg-7">
                            <div className="row g-3">
                                {WHY.map(([icon, title, text]) => (
                                    <div className="col-sm-6" key={title}>
                                        <div className="card border-0 h-100 p-4 card-hover">
                                            <span className="feature-icon mb-3"><i className={`mdi ${icon}`} /></span>
                                            <h6 className="fw-bold">{title}</h6>
                                            <p className="small text-soft mb-0">{text}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Cars ------------------------------------------------------------------ */}
            {data?.cars?.length > 0 && (
                <section className="section pt-0">
                    <div className="container">
                        <SectionHeader eyebrow="Drive" title="Rent a car" subtitle="Self-drive or chauffeur-driven, by the day" link="/cars" />
                        <div className="row g-4">{data.cars.map((c) => <div className="col-sm-6 col-lg-3" key={c.id}><CarCard car={c} /></div>)}</div>
                    </div>
                </section>
            )}

            {/* Recently viewed (local) ---------------------------------------------- */}
            {recent.length > 0 && (
                <section className="section pt-0">
                    <div className="container">
                        <SectionHeader eyebrow="Continue planning" title="Recently viewed" />
                        <div className="d-flex gap-3 overflow-auto pb-2">
                            {recent.map((r) => (
                                <Link key={`${r.type}${r.id}`} to={r.url} className="card border-0 card-hover text-reset flex-shrink-0" style={{ width: 230 }}>
                                    <Img src={r.image} alt={r.name} className="card-img-top object-cover" style={{ height: 120 }} />
                                    <div className="card-body py-2"><div className="small fw-semibold text-truncate">{r.name}</div><div className="small text-soft text-capitalize">{r.type}</div></div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Testimonials ------------------------------------------------------------ */}
            {data?.testimonials?.length > 0 && (
                <section className="section bg-body-tertiary">
                    <div className="container">
                        <SectionHeader eyebrow="Reviews" title="Loved by travellers" />
                        <div className="row g-4">
                            {data.testimonials.slice(0, 3).map((t) => (
                                <div className="col-md-4" key={t.id}>
                                    <div className="card border-0 h-100 p-4">
                                        <Stars value={t.rating} />
                                        <h6 className="fw-bold mt-2">“{t.title}”</h6>
                                        <p className="text-soft small flex-grow-1">{t.comment}</p>
                                        <div className="d-flex align-items-center gap-2 mt-2">
                                            <img src={t.user?.avatar_url} alt="" width="36" height="36" className="rounded-circle" />
                                            <div className="small"><div className="fw-semibold">{t.user?.name}</div><div className="text-soft">{date(t.created_at)}</div></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}
            <div className="pb-5" />
        </>
    );
}
