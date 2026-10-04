import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { logout } from '../../store/authSlice';
import { toggleTheme } from '../../store/uiSlice';
import Brand from './Brand';
import Dropdown from './Dropdown';
import NotificationBell from './NotificationBell';

const LINKS = [
    { to: '/hotels', label: 'Hotels', icon: 'mdi-bed' },
    { to: '/flights', label: 'Flights', icon: 'mdi-airplane' },
    { to: '/buses', label: 'Buses', icon: 'mdi-bus' },
    { to: '/tours', label: 'Tours', icon: 'mdi-island' },
    { to: '/cars', label: 'Cars', icon: 'mdi-car' },
    { to: '/destinations', label: 'Destinations', icon: 'mdi-map-marker-radius' },
];

/** Sticky site header. Transparent over the home hero, solid elsewhere / after scrolling. */
export default function Navbar() {
    const user = useSelector((s) => s.auth.user);
    const theme = useSelector((s) => s.ui.theme);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const [scrolled, setScrolled] = useState(false);
    const [menu, setMenu] = useState(false);
    const overHero = pathname === '/';

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => setMenu(false), [pathname]);

    const mode = overHero && !scrolled && !menu ? 'transparent' : scrolled ? 'scrolled' : 'solid';

    return (
        <nav className={`navbar navbar-expand-lg navbar-site sticky-top ${mode}`}>
            <div className="container">
                <Brand />
                <button className="navbar-toggler border-0" type="button" onClick={() => setMenu(!menu)} aria-label="Toggle navigation" aria-expanded={menu}>
                    <i className={`mdi ${menu ? 'mdi-close' : 'mdi-menu'} fs-3 ${mode === 'transparent' ? 'text-white' : ''}`} />
                </button>
                <div className={`collapse navbar-collapse ${menu ? 'show' : ''}`}>
                    <ul className="navbar-nav mx-auto gap-lg-1">
                        {LINKS.map((l) => (
                            <li className="nav-item" key={l.to}>
                                <NavLink to={l.to} className="nav-link"><i className={`mdi ${l.icon} me-1 d-lg-none`} />{l.label}</NavLink>
                            </li>
                        ))}
                    </ul>
                    <div className="d-flex align-items-center gap-2 py-2 py-lg-0">
                        <button className="btn btn-icon btn-link btn-theme" onClick={() => dispatch(toggleTheme())} aria-label="Toggle dark mode" title="Toggle dark mode">
                            <i className={`mdi ${theme === 'dark' ? 'mdi-weather-sunny' : 'mdi-weather-night'} fs-5`} />
                        </button>
                        {user ? (
                            <>
                                <NotificationBell className={mode === 'transparent' ? 'text-white' : ''} />
                                <Dropdown toggle={({ onClick }) => (
                                    <button type="button" className="btn d-flex align-items-center gap-2 border-0 p-1 pe-2 rounded-pill bg-body-tertiary" onClick={onClick}>
                                        <img src={user.avatar_url} alt="" width="32" height="32" className="rounded-circle object-cover" />
                                        <span className="small fw-semibold d-none d-xl-inline">{user.name.split(' ')[0]}</span>
                                        <i className="mdi mdi-chevron-down" />
                                    </button>
                                )}>
                                    <div className="px-3 py-2 border-bottom mb-1">
                                        <div className="fw-bold">{user.name}</div>
                                        <div className="small text-soft">{user.email}</div>
                                    </div>
                                    {user.role === 'admin' && <Link className="dropdown-item" to="/admin"><i className="mdi mdi-view-dashboard-outline me-2" />Admin panel</Link>}
                                    <Link className="dropdown-item" to="/account"><i className="mdi mdi-account-circle-outline me-2" />My account</Link>
                                    <Link className="dropdown-item" to="/account/bookings"><i className="mdi mdi-ticket-confirmation-outline me-2" />My bookings</Link>
                                    <Link className="dropdown-item" to="/account/wishlist"><i className="mdi mdi-heart-outline me-2" />Wishlist</Link>
                                    <div className="dropdown-divider" />
                                    <button className="dropdown-item text-danger" data-close onClick={async () => { await dispatch(logout()); navigate('/'); }}>
                                        <i className="mdi mdi-logout me-2" />Sign out
                                    </button>
                                </Dropdown>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className={`btn btn-link fw-semibold text-decoration-none ${mode === 'transparent' ? 'text-white' : ''}`}>Sign in</Link>
                                <Link to="/register" className="btn btn-gradient rounded-pill px-4">Register</Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
