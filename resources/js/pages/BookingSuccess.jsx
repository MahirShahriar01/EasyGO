import { Link, useParams } from 'react-router-dom';
import InterstitialAd from '../components/ads/InterstitialAd';
import { Spinner } from '../components/common/Feedback';
import useApi from '../hooks/useApi';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { date, money } from '../utils/format';
import { Stepper } from './Checkout';

export default function BookingSuccess() {
    useDocumentTitle('Booking confirmed');
    const { reference } = useParams();
    const { data, loading } = useApi(`/bookings/${reference}`);

    if (loading) return <Spinner className="py-5 min-vh-50" />;
    const b = data.booking;

    return (
        <div className="container py-4 py-lg-5" style={{ maxWidth: 860 }}>
            <Stepper step={2} />
            <div className="card border-0 p-4 p-lg-5 text-center">
                <div className="mx-auto mb-3 bg-success bg-opacity-10 text-success rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: 88, height: 88 }}>
                    <i className="mdi mdi-check-bold display-5" />
                </div>
                <h1 className="h3 fw-800">You're all set, {b.contact_name.split(' ')[0]}!</h1>
                <p className="text-soft">Your booking is <strong className="text-success">{b.status}</strong>. A confirmation e-mail has been sent to <strong>{b.contact_email}</strong>.</p>
                <div className="bg-body-tertiary rounded-4 p-4 my-3 text-start">
                    <div className="row g-3">
                        <div className="col-sm-6"><div className="small text-soft">Reference</div><div className="fw-800 fs-5">{b.reference}</div></div>
                        <div className="col-sm-6"><div className="small text-soft">Total {b.payment_status === 'paid' ? 'paid' : 'due at property'}</div><div className="fw-800 fs-5 text-primary">{money(b.total)}</div></div>
                        <div className="col-sm-6"><div className="small text-soft">Booking</div><div className="fw-semibold">{b.item_name}</div></div>
                        <div className="col-sm-6"><div className="small text-soft">Date</div><div className="fw-semibold">{date(b.start_date)}{b.end_date && b.service_type !== 'tour' ? ` → ${date(b.end_date)}` : ''}</div></div>
                    </div>
                </div>
                <div className="d-flex flex-wrap justify-content-center gap-2">
                    <Link to={`/account/bookings/${b.reference}`} className="btn btn-gradient"><i className="mdi mdi-ticket-confirmation-outline" /> View e-ticket / voucher</Link>
                    <Link to="/" className="btn btn-light">Back to home</Link>
                </div>
            </div>
            <InterstitialAd zone="interstitial_booking_success" delay={1500} oncePerSession={false} />
        </div>
    );
}
