import { Link } from 'react-router-dom';
import Img from '../../components/common/Img';
import { date, money, SERVICE_ICON, STATUS_BADGE } from '../../utils/format';

/** Compact booking card used in the account dashboard and bookings list. */
export default function BookingRow({ b }) {
    return (
        <Link to={`/account/bookings/${b.reference}`} className="card border-0 card-hover text-reset mb-3">
            <div className="card-body d-flex flex-wrap gap-3 align-items-center">
                {b.item_image_url
                    ? <Img src={b.item_image_url} alt="" className="rounded-3 object-cover" style={{ width: 84, height: 64 }} />
                    : <span className="feature-icon" style={{ width: 84, height: 64 }}><i className={`mdi ${SERVICE_ICON[b.service_type]}`} /></span>}
                <div className="flex-grow-1 min-w-0">
                    <div className="small text-soft text-capitalize"><i className={`mdi ${SERVICE_ICON[b.service_type]}`} /> {b.service_type} · {b.reference}</div>
                    <div className="fw-bold text-truncate">{b.item_name}</div>
                    <div className="small text-soft">{date(b.start_date)}{b.end_date && b.service_type !== 'tour' ? ` → ${date(b.end_date)}` : ''}</div>
                </div>
                <div className="text-end">
                    <div className="fw-800">{money(b.total)}</div>
                    <span className={`badge text-bg-${STATUS_BADGE[b.status]} text-capitalize me-1`}>{b.status}</span>
                    <span className={`badge text-bg-${STATUS_BADGE[b.payment_status]} text-capitalize`}>{b.payment_status}</span>
                </div>
            </div>
        </Link>
    );
}
