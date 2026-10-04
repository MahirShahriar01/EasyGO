import { useDispatch, useSelector } from 'react-redux';
import { Link, NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import Dropdown from '../components/layout/Dropdown';
import { logout } from '../store/authSlice';
import { toggleSidebar, toggleTheme } from '../store/uiSlice';
import ResourcePage from './components/ResourcePage';
import AdForm from './pages/AdForm';
import Ads from './pages/Ads';
import AdStats from './pages/AdStats';
import Bookings from './pages/Bookings';
import BookingView from './pages/BookingView';
import Dashboard from './pages/Dashboard';
import HotelRooms from './pages/HotelRooms';
import Messages from './pages/Messages';
import Reviews from './pages/Reviews';
import Settings from './pages/Settings';
import Subscribers from './pages/Subscribers';
import * as R from './resources';

const NAV = [
    ['Overview', [['/admin', 'Dashboard', 'mdi-view-dashboard-outline', true], ['/admin/bookings', 'Bookings', 'mdi-ticket-confirmation-outline']]],
    ['Inventory', [
        ['/admin/destinations', 'Destinations', 'mdi-map-marker-radius'], ['/admin/hotels', 'Hotels', 'mdi-office-building'],
        ['/admin/flights', 'Flights', 'mdi-airplane'], ['/admin/buses', 'Buses', 'mdi-bus'],
        ['/admin/tours', 'Tours', 'mdi-island'], ['/admin/cars', 'Cars', 'mdi-car'],
    ]],
    ['Advertising', [['/admin/ads', 'Ads', 'mdi-bullhorn-outline'], ['/admin/ad-zones', 'Ad zones', 'mdi-view-grid-plus-outline']]],
    ['Marketing', [['/admin/coupons', 'Coupons', 'mdi-ticket-percent-outline'], ['/admin/subscribers', 'Subscribers', 'mdi-email-multiple-outline']]],
    ['Customers', [['/admin/users', 'Users', 'mdi-account-group'], ['/admin/reviews', 'Reviews', 'mdi-star-outline'], ['/admin/messages', 'Messages', 'mdi-message-text-outline']]],
    ['System', [['/admin/settings', 'Settings', 'mdi-cog-outline']]],
];

/** Back-office shell: fixed sidebar (off-canvas on mobile), sticky topbar and routed content. */
export default function AdminApp() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const user = useSelector((s) => s.auth.user);
    const { sidebarOpen, theme } = useSelector((s) => s.ui);
    const site = useSelector((s) => s.settings.site_name);

    return (
        <div className="admin-shell">
            <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
                <Link to="/admin" className="brand-logo text-decoration-none d-flex"><span className="mark"><i className="mdi mdi-airplane-takeoff" /></span>{site} <small className="badge bg-primary ms-1 align-self-center fw-semibold" style={{ fontSize: '.6rem' }}>ADMIN</small></Link>
                <nav className="pb-4">
                    {NAV.map(([section, links]) => (
                        <div key={section}>
                            <div className="nav-section">{section}</div>
                            {links.map(([to, label, icon, end]) => (
                                <NavLink key={to} to={to} end={end} className="nav-link" onClick={() => dispatch(toggleSidebar(false))}>
                                    <i className={`mdi ${icon}`} />{label}
                                </NavLink>
                            ))}
                        </div>
                    ))}
                    <div className="nav-section">Shortcuts</div>
                    <a href="/" className="nav-link" target="_blank" rel="noreferrer"><i className="mdi mdi-open-in-new" />View website</a>
                </nav>
            </aside>
            {sidebarOpen && <div className="admin-backdrop d-lg-none" onClick={() => dispatch(toggleSidebar(false))} />}

            <div className="admin-main">
                <header className="admin-topbar px-3 px-lg-4 py-2 d-flex align-items-center gap-2">
                    <button className="btn btn-icon btn-light d-lg-none" onClick={() => dispatch(toggleSidebar())} aria-label="Menu"><i className="mdi mdi-menu" /></button>
                    <div className="flex-grow-1" />
                    <Link to="/admin/ads/new" className="btn btn-sm btn-outline-primary d-none d-md-inline-flex"><i className="mdi mdi-plus me-1" />New ad</Link>
                    <button className="btn btn-icon btn-link" onClick={() => dispatch(toggleTheme())} aria-label="Toggle theme"><i className={`mdi ${theme === 'dark' ? 'mdi-weather-sunny' : 'mdi-weather-night'} fs-5`} /></button>
                    <Dropdown toggle={({ onClick }) => (
                        <button className="btn d-flex align-items-center gap-2 border-0" onClick={onClick}>
                            <img src={user.avatar_url} alt="" width="34" height="34" className="rounded-circle" />
                            <span className="small fw-semibold d-none d-sm-inline">{user.name}</span><i className="mdi mdi-chevron-down" />
                        </button>
                    )}>
                        <Link className="dropdown-item" to="/account/profile"><i className="mdi mdi-account-outline me-2" />My profile</Link>
                        <a className="dropdown-item" href="/"><i className="mdi mdi-web me-2" />Customer site</a>
                        <div className="dropdown-divider" />
                        <button className="dropdown-item text-danger" data-close onClick={async () => { await dispatch(logout()); navigate('/login'); }}><i className="mdi mdi-logout me-2" />Sign out</button>
                    </Dropdown>
                </header>

                <main className="p-3 p-lg-4 page-fade">
                    <Routes>
                        <Route index element={<Dashboard />} />
                        <Route path="bookings" element={<Bookings />} />
                        <Route path="bookings/:reference" element={<BookingView />} />
                        <Route path="destinations" element={<ResourcePage config={R.destinations} />} />
                        <Route path="hotels" element={<ResourcePage config={R.hotels} />} />
                        <Route path="hotels/:id/rooms" element={<HotelRooms />} />
                        <Route path="flights" element={<ResourcePage config={R.flights} />} />
                        <Route path="buses" element={<ResourcePage config={R.buses} />} />
                        <Route path="tours" element={<ResourcePage config={R.tours} />} />
                        <Route path="cars" element={<ResourcePage config={R.cars} />} />
                        <Route path="coupons" element={<ResourcePage config={R.coupons} />} />
                        <Route path="users" element={<ResourcePage config={R.users} />} />
                        <Route path="ad-zones" element={<ResourcePage config={R.adZones} />} />
                        <Route path="ads" element={<Ads />} />
                        <Route path="ads/new" element={<AdForm />} />
                        <Route path="ads/:id/edit" element={<AdForm />} />
                        <Route path="ads/:id/stats" element={<AdStats />} />
                        <Route path="reviews" element={<Reviews />} />
                        <Route path="messages" element={<Messages />} />
                        <Route path="subscribers" element={<Subscribers />} />
                        <Route path="settings" element={<Settings />} />
                        <Route path="*" element={<Navigate to="/admin" replace />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
}
