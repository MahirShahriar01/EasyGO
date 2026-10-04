import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isoDate } from '../../utils/format';
import Autocomplete from '../common/Autocomplete';

export const TABS = [
    { key: 'hotels', label: 'Hotels', icon: 'mdi-bed' },
    { key: 'flights', label: 'Flights', icon: 'mdi-airplane' },
    { key: 'buses', label: 'Buses', icon: 'mdi-bus' },
    { key: 'tours', label: 'Tours', icon: 'mdi-island' },
    { key: 'cars', label: 'Cars', icon: 'mdi-car' },
];

const Field = ({ label, children, className = 'col-md' }) => (
    <div className={className}>
        <div className="field">
            <label>{label}</label>
            {children}
        </div>
    </div>
);

const SubmitButton = () => (
    <div className="col-md-auto d-grid">
        <button className="btn btn-gradient btn-lg rounded-4 px-4 h-100"><i className="mdi mdi-magnify me-1" />Search</button>
    </div>
);

/**
 * Tabbed search box for every vertical. Each tab navigates to its results page
 * with the criteria in the query string (so results are shareable/bookmarkable).
 * `initial` pre-fills the form from the current URL on results pages.
 */
export default function SearchWidget({ tab: initialTab = 'hotels', initial = {}, compact = false, tabs = true }) {
    const navigate = useNavigate();
    const [tab, setTab] = useState(initialTab);
    const [f, setF] = useState({
        q: initial.q ?? '',
        check_in: initial.check_in ?? isoDate(7),
        check_out: initial.check_out ?? isoDate(9),
        adults: initial.adults ?? '2',
        children: initial.children ?? '0',
        rooms: initial.rooms ?? '1',
        from: initial.from ?? 'Dhaka',
        to: initial.to ?? '',
        date: initial.date ?? isoDate(3),
        passengers: initial.passengers ?? '1',
        cabin: initial.cabin ?? '',
        location: initial.location ?? '',
        pickup_date: initial.pickup_date ?? isoDate(2),
        dropoff_date: initial.dropoff_date ?? isoDate(5),
    });
    const set = (k) => (e) => setF((s) => ({ ...s, [k]: e?.target ? e.target.value : e }));
    const go = (path, params) => {
        const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null));
        navigate(`${path}?${qs}`);
    };

    const submit = (e) => {
        e.preventDefault();
        if (tab === 'hotels') go('/hotels', { q: f.q, check_in: f.check_in, check_out: f.check_out, adults: f.adults, children: f.children, rooms: f.rooms });
        if (tab === 'flights') go('/flights', { from: f.from, to: f.to, date: f.date, passengers: f.passengers, cabin: f.cabin });
        if (tab === 'buses') go('/buses', { from: f.from, to: f.to, date: f.date });
        if (tab === 'tours') go('/tours', { q: f.q, date: f.date });
        if (tab === 'cars') go('/cars', { location: f.location, pickup_date: f.pickup_date, dropoff_date: f.dropoff_date });
    };

    const swap = () => setF((s) => ({ ...s, from: s.to, to: s.from }));
    const today = isoDate(0);

    return (
        <div className={`search-widget ${compact ? 'p-3' : 'p-3 p-lg-4'}`}>
            {tabs && (
                <ul className="nav nav-pills gap-1 mb-3 flex-nowrap overflow-auto" role="tablist">
                    {TABS.map((t) => (
                        <li className="nav-item" key={t.key}>
                            <button type="button" role="tab" aria-selected={tab === t.key} className={`nav-link text-nowrap ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
                                <i className={`mdi ${t.icon} me-1`} />{t.label}
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            <form onSubmit={submit} className="row g-2">
                {tab === 'hotels' && (
                    <>
                        <Field label="Destination or hotel" className="col-md-4">
                            <Autocomplete value={f.q} onChange={set('q')} placeholder="Where are you going?" icon="mdi-map-marker-outline" />
                        </Field>
                        <Field label="Check-in"><input type="date" min={today} value={f.check_in} onChange={(e) => setF((s) => ({ ...s, check_in: e.target.value, check_out: s.check_out <= e.target.value ? isoDate(1, new Date(e.target.value)) : s.check_out }))} required /></Field>
                        <Field label="Check-out"><input type="date" min={f.check_in} value={f.check_out} onChange={set('check_out')} required /></Field>
                        <Field label="Guests & rooms" className="col-md-3">
                            <div className="d-flex gap-2 align-items-center small">
                                <select value={f.adults} onChange={set('adults')} aria-label="Adults">{[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <option key={n} value={n}>{n} adult{n > 1 ? 's' : ''}</option>)}</select>
                                <select value={f.children} onChange={set('children')} aria-label="Children">{[0, 1, 2, 3, 4].map((n) => <option key={n} value={n}>{n} child</option>)}</select>
                                <select value={f.rooms} onChange={set('rooms')} aria-label="Rooms">{[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n} room{n > 1 ? 's' : ''}</option>)}</select>
                            </div>
                        </Field>
                    </>
                )}

                {(tab === 'flights' || tab === 'buses') && (
                    <>
                        <Field label="From" className="col-md-3">
                            <Autocomplete value={f.from} onChange={set('from')} type={tab === 'flights' ? 'flight' : 'bus'} placeholder="Leaving from" icon={tab === 'flights' ? 'mdi-airplane-takeoff' : 'mdi-bus-stop'} required />
                        </Field>
                        <div className="col-md-auto d-flex align-items-center justify-content-center">
                            <button type="button" className="btn btn-light btn-icon" onClick={swap} aria-label="Swap origin and destination"><i className="mdi mdi-swap-horizontal" /></button>
                        </div>
                        <Field label="To" className="col-md-3">
                            <Autocomplete value={f.to} onChange={set('to')} type={tab === 'flights' ? 'flight' : 'bus'} placeholder="Going to" icon={tab === 'flights' ? 'mdi-airplane-landing' : 'mdi-map-marker'} />
                        </Field>
                        <Field label="Journey date"><input type="date" min={today} value={f.date} onChange={set('date')} /></Field>
                        {tab === 'flights' && (
                            <Field label="Travellers & class">
                                <div className="d-flex gap-2 small">
                                    <select value={f.passengers} onChange={set('passengers')} aria-label="Passengers">{[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => <option key={n} value={n}>{n} pax</option>)}</select>
                                    <select value={f.cabin} onChange={set('cabin')} aria-label="Cabin class">
                                        <option value="">Any class</option><option value="economy">Economy</option><option value="business">Business</option>
                                    </select>
                                </div>
                            </Field>
                        )}
                    </>
                )}

                {tab === 'tours' && (
                    <>
                        <Field label="Destination or tour" className="col-md-6">
                            <Autocomplete value={f.q} onChange={set('q')} placeholder="Bali, Sylhet, Maldives…" icon="mdi-compass-outline" />
                        </Field>
                        <Field label="Travel date"><input type="date" min={isoDate(1)} value={f.date} onChange={set('date')} /></Field>
                    </>
                )}

                {tab === 'cars' && (
                    <>
                        <Field label="Pick-up city" className="col-md-4">
                            <Autocomplete value={f.location} onChange={set('location')} placeholder="Dhaka, Cox's Bazar…" icon="mdi-map-marker-outline" />
                        </Field>
                        <Field label="Pick-up date"><input type="date" min={today} value={f.pickup_date} onChange={(e) => setF((s) => ({ ...s, pickup_date: e.target.value, dropoff_date: s.dropoff_date <= e.target.value ? isoDate(1, new Date(e.target.value)) : s.dropoff_date }))} /></Field>
                        <Field label="Drop-off date"><input type="date" min={f.pickup_date} value={f.dropoff_date} onChange={set('dropoff_date')} /></Field>
                    </>
                )}

                <SubmitButton />
            </form>
        </div>
    );
}
