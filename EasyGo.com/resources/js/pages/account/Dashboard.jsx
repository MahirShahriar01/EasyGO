import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { EmptyState, Spinner } from '../../components/common/Feedback';
import useApi from '../../hooks/useApi';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { fetchMe } from '../../store/authSlice';
import BookingRow from './BookingRow';

export default function Dashboard() {
    useDocumentTitle('My account');
    const dispatch = useDispatch();
    const { user, stats } = useSelector((s) => s.auth);
    const { data, loading } = useApi('/bookings', { scope: 'upcoming' });
    useEffect(() => { dispatch(fetchMe()); }, [dispatch]);

    const tiles = [
        ['Total bookings', stats?.bookings, 'mdi-ticket-confirmation-outline', 'primary', '/account/bookings'],
        ['Upcoming trips', stats?.upcoming, 'mdi-calendar-star', 'success', '/account/bookings?scope=upcoming'],
        ['Saved items', stats?.wishlist, 'mdi-heart-outline', 'danger', '/account/wishlist'],
        ['Unread alerts', stats?.unread_notifications, 'mdi-bell-outline', 'warning', '/account/notifications'],
    ];

    return (
        <>
            <h1 className="h3 fw-800 mb-1">Hello, {user.name.split(' ')[0]} 👋</h1>
            <p className="text-soft mb-4">Here's what's happening with your trips.</p>
            <div className="row g-3 mb-4">
                {tiles.map(([label, value, icon, color, to]) => (
                    <div className="col-6 col-xl-3" key={label}>
                        <Link to={to} className="card border-0 p-3 card-hover text-reset h-100">
                            <span className={`feature-icon bg-${color} bg-opacity-10 text-${color} mb-2`}><i className={`mdi ${icon}`} /></span>
                            <div className="fs-3 fw-800">{value ?? '–'}</div>
                            <div className="small text-soft">{label}</div>
                        </Link>
                    </div>
                ))}
            </div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold mb-0">Upcoming trips</h5>
                <Link to="/account/bookings" className="small">All bookings →</Link>
            </div>
            {loading && <Spinner />}
            {data?.data?.length === 0 && <div className="card border-0"><EmptyState icon="mdi-bag-suitcase-outline" title="No upcoming trips" text="Time to plan something exciting!" action={<Link to="/" className="btn btn-gradient">Start exploring</Link>} /></div>}
            {data?.data?.slice(0, 5).map((b) => <BookingRow key={b.id} b={b} />)}
        </>
    );
}
