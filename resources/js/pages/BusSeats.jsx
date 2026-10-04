import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import AdSlot from '../components/ads/AdSlot';
import { ErrorState, Spinner } from '../components/common/Feedback';
import useApi from '../hooks/useApi';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { dateTime, duration, money } from '../utils/format';

const MAX_SEATS = 6;

/** Interactive seat map: rows of seats split by an aisle according to the coach layout (e.g. 2-2, 1-2). */
export default function BusSeats() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data, loading, error, reload } = useApi(`/buses/${id}`);
    const [selected, setSelected] = useState([]);
    useDocumentTitle(data ? `${data.bus.operator} seats` : 'Select seats');

    const rows = useMemo(() => {
        if (!data) return [];
        const [left, right] = data.bus.seat_layout.split('-').map(Number);
        const perRow = left + right;
        const out = [];
        for (let i = 0; i < data.seats.length; i += perRow) {
            const row = data.seats.slice(i, i + perRow);
            out.push([row.slice(0, left), row.slice(left)]);
        }
        return out;
    }, [data]);

    if (loading) return <Spinner className="py-5 min-vh-50" />;
    if (error) return <div className="container py-5"><ErrorState message={error} onRetry={reload} /></div>;

    const { bus, booked_seats: booked } = data;
    const toggle = (seat) => {
        if (selected.includes(seat)) setSelected(selected.filter((s) => s !== seat));
        else if (selected.length >= MAX_SEATS) toast.info(`You can select up to ${MAX_SEATS} seats.`);
        else setSelected([...selected, seat]);
    };

    const proceed = () => {
        const qs = new URLSearchParams({ service_type: 'bus', item_id: bus.id });
        selected.forEach((s) => qs.append('seats', s));
        navigate(`/checkout?${qs}`);
    };

    // Plain render function (not a nested component) so seats aren't remounted on every selection.
    const seat = (label) => (
        <button key={label} type="button" className={`seat ${selected.includes(label) ? 'selected' : ''}`} disabled={booked.includes(label)} onClick={() => toggle(label)} aria-pressed={selected.includes(label)} aria-label={`Seat ${label}`}>
            {label}
        </button>
    );

    return (
        <div className="container py-4">
            <button className="btn btn-link btn-sm p-0" onClick={() => navigate(-1)}><i className="mdi mdi-arrow-left" /> Back to results</button>
            <div className="row g-4 mt-1">
                <div className="col-lg-7">
                    <div className="card border-0 p-4">
                        <h1 className="h4 fw-800 mb-1">{bus.operator}</h1>
                        <div className="text-soft mb-3">{bus.coach_no} · {bus.bus_type} · {bus.seat_layout} layout</div>
                        <div className="d-flex flex-wrap gap-3 small mb-4">
                            <span><span className="seat d-inline-flex me-1" style={{ width: 20, height: 20 }} /> Available</span>
                            <span><span className="seat selected d-inline-flex me-1" style={{ width: 20, height: 20 }} /> Selected</span>
                            <span><button className="seat d-inline-flex me-1" style={{ width: 20, height: 20 }} disabled /> Booked</span>
                        </div>
                        <div className="text-center overflow-auto">
                            <div className="seat-map">
                                <div className="d-flex justify-content-between align-items-center mb-3 text-soft small">
                                    <span><i className="mdi mdi-door" /> Entry</span>
                                    <span><i className="mdi mdi-steering fs-4" /></span>
                                </div>
                                {rows.map(([left, right], i) => (
                                    <div className="seat-row" key={i}>
                                        {left.map(seat)}
                                        <span className="seat-aisle" />
                                        {right.map(seat)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-lg-5">
                    <div className="summary-sticky">
                        <div className="card border-0 p-4 mb-3">
                            <h5 className="fw-bold">{bus.from_city} → {bus.to_city}</h5>
                            <div className="timeline mt-3">
                                <div className="tl-item"><div className="fw-semibold">{dateTime(bus.departure_at)}</div><div className="small text-soft">{bus.boarding_point}</div></div>
                                <div className="tl-item"><div className="fw-semibold">{dateTime(bus.arrival_at)}</div><div className="small text-soft">{bus.dropping_point} · {duration(bus.duration_minutes)}</div></div>
                            </div>
                            <div className="d-flex flex-wrap gap-2 mb-3">{(bus.amenities || []).map((a) => <span key={a} className="badge text-bg-light">{a}</span>)}</div>
                            <hr />
                            <div className="d-flex justify-content-between mb-1"><span>Seats</span><strong>{selected.length ? selected.join(', ') : '—'}</strong></div>
                            <div className="d-flex justify-content-between mb-1"><span>Fare</span><span>{money(bus.price)} × {selected.length}</span></div>
                            <div className="d-flex justify-content-between fs-5 fw-bold mt-2"><span>Total</span><span className="text-primary">{money(bus.price * selected.length)}</span></div>
                            <button className="btn btn-gradient w-100 mt-3" disabled={!selected.length} onClick={proceed}>Continue to checkout</button>
                            <div className="small text-soft mt-2 text-center">Taxes & fees calculated at checkout</div>
                        </div>
                        <AdSlot zone="detail_sidebar" />
                    </div>
                </div>
            </div>
        </div>
    );
}
