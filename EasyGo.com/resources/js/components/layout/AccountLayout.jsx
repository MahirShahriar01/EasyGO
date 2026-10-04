import { useSelector } from 'react-redux';
import { NavLink, Outlet } from 'react-router-dom';
import AdSlot from '../ads/AdSlot';

const LINKS = [
    ['/account', 'Dashboard', 'mdi-view-dashboard-outline', true],
    ['/account/bookings', 'My bookings', 'mdi-ticket-confirmation-outline'],
    ['/account/wishlist', 'Wishlist', 'mdi-heart-outline'],
    ['/account/reviews', 'My reviews', 'mdi-star-outline'],
    ['/account/notifications', 'Notifications', 'mdi-bell-outline'],
    ['/account/profile', 'Profile & security', 'mdi-account-cog-outline'],
];

export default function AccountLayout() {
    const user = useSelector((s) => s.auth.user);
    return (
        <div className="container py-4 py-lg-5">
            <div className="row g-4">
                <aside className="col-lg-3 no-print">
                    <div className="card border-0 p-3">
                        <div className="d-flex align-items-center gap-3 p-2 mb-2">
                            <img src={user.avatar_url} alt="" width="52" height="52" className="rounded-circle object-cover" />
                            <div className="min-w-0">
                                <div className="fw-bold text-truncate">{user.name}</div>
                                <div className="small text-soft text-truncate">{user.email}</div>
                            </div>
                        </div>
                        <div className="list-group list-group-flush account-nav">
                            {LINKS.map(([to, label, icon, end]) => (
                                <NavLink key={to} to={to} end={end} className="list-group-item list-group-item-action">
                                    <i className={`mdi ${icon}`} />{label}
                                </NavLink>
                            ))}
                        </div>
                    </div>
                </aside>
                <section className="col-lg-9 print-full">
                    <div className="mb-4 no-print"><AdSlot zone="account_banner" /></div>
                    <Outlet />
                </section>
            </div>
        </div>
    );
}
