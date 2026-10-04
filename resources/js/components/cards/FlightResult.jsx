import { duration, money, time, date } from '../../utils/format';

/** One flight in the results list with a "Select" action. */
export default function FlightResult({ flight, passengers = 1, onSelect }) {
    return (
        <div className="card border-0 result-row mb-3">
            <div className="card-body">
                <div className="row align-items-center g-3">
                    <div className="col-md-3 d-flex align-items-center gap-3">
                        <div className="feature-icon flex-shrink-0" style={{ width: 48, height: 48, fontSize: '1rem', fontWeight: 800 }}>{flight.airline_code}</div>
                        <div>
                            <div className="fw-bold">{flight.airline}</div>
                            <div className="small text-soft">{flight.flight_number} · <span className="text-capitalize">{flight.cabin_class}</span></div>
                        </div>
                    </div>
                    <div className="col-md-5">
                        <div className="d-flex align-items-center gap-3">
                            <div className="text-center">
                                <div className="fs-5 fw-bold">{time(flight.departure_at)}</div>
                                <div className="small fw-semibold">{flight.from_code}</div>
                            </div>
                            <div className="flex-grow-1 text-center">
                                <div className="small text-soft">{duration(flight.duration_minutes)}</div>
                                <div className="flight-line my-1"><i className="mdi mdi-airplane plane" /></div>
                                <div className={`small ${flight.stops ? 'text-warning' : 'text-success'} fw-semibold`}>{flight.stops ? `${flight.stops} stop` : 'Non-stop'}</div>
                            </div>
                            <div className="text-center">
                                <div className="fs-5 fw-bold">{time(flight.arrival_at)}</div>
                                <div className="small fw-semibold">{flight.to_code}</div>
                            </div>
                        </div>
                        <div className="small text-soft text-center mt-1">{date(flight.departure_at, { weekday: 'short', day: 'numeric', month: 'short' })}</div>
                    </div>
                    <div className="col-md-2 small">
                        <div><i className="mdi mdi-bag-checked text-primary" /> {flight.baggage}</div>
                        <div className={flight.refundable ? 'text-success' : 'text-soft'}><i className={`mdi ${flight.refundable ? 'mdi-cash-refund' : 'mdi-cash-remove'}`} /> {flight.refundable ? 'Refundable' : 'Non-refundable'}</div>
                        {flight.seats_available < 10 && <div className="text-danger fw-semibold"><i className="mdi mdi-fire" /> {flight.seats_available} seats left</div>}
                    </div>
                    <div className="col-md-2 text-md-end">
                        <div className="price-tag text-primary">{money(flight.price)}</div>
                        <div className="small text-soft mb-2">per traveller{passengers > 1 ? ` · ${money(flight.price * passengers)} total` : ''}</div>
                        <button className="btn btn-gradient rounded-pill px-4" onClick={() => onSelect(flight)}>Select</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
