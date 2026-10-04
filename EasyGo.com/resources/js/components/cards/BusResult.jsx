import { Link } from 'react-router-dom';
import { duration, money, time, date } from '../../utils/format';

export default function BusResult({ bus }) {
    return (
        <div className="card border-0 result-row mb-3">
            <div className="card-body">
                <div className="row align-items-center g-3">
                    <div className="col-md-3">
                        <div className="fw-bold">{bus.operator}</div>
                        <div className="small text-soft">{bus.coach_no} · <span className={`badge ${bus.bus_type === 'Non-AC' ? 'text-bg-secondary' : 'text-bg-info'}`}>{bus.bus_type}</span></div>
                    </div>
                    <div className="col-md-4">
                        <div className="d-flex align-items-center gap-3">
                            <div><div className="fs-5 fw-bold">{time(bus.departure_at)}</div><div className="small text-soft">{bus.from_city}</div></div>
                            <div className="flex-grow-1 text-center small text-soft"><i className="mdi mdi-bus" /><div className="border-top my-1" />{duration(bus.duration_minutes)}</div>
                            <div className="text-end"><div className="fs-5 fw-bold">{time(bus.arrival_at)}</div><div className="small text-soft">{bus.to_city}</div></div>
                        </div>
                        <div className="small text-soft mt-1">{date(bus.departure_at, { weekday: 'short', day: 'numeric', month: 'short' })} · Boarding: {bus.boarding_point}</div>
                    </div>
                    <div className="col-md-3 small text-soft">
                        {(bus.amenities || []).slice(0, 3).map((a) => <div key={a}><i className="mdi mdi-check text-success" /> {a}</div>)}
                        <div className={bus.seats_available < 8 ? 'text-danger fw-semibold' : ''}><i className="mdi mdi-seat-passenger" /> {bus.seats_available} seats available</div>
                    </div>
                    <div className="col-md-2 text-md-end">
                        <div className="price-tag text-primary">{money(bus.price)}</div>
                        <div className="small text-soft mb-2">per seat</div>
                        <Link to={`/buses/${bus.id}`} className={`btn rounded-pill px-4 ${bus.seats_available ? 'btn-gradient' : 'btn-secondary disabled'}`}>Select seats</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
