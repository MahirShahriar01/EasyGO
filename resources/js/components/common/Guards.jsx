import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { Spinner } from './Feedback';

/** Requires a signed-in user; remembers where to come back after login. */
export function RequireAuth({ children, admin = false }) {
    const { user, status } = useSelector((s) => s.auth);
    const location = useLocation();

    if (status === 'loading') return <Spinner className="min-vh-50 d-flex flex-column justify-content-center" />;
    if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
    if (admin && user.role !== 'admin') return <Navigate to="/" replace />;
    return children;
}

/** Login / register pages redirect away once authenticated. */
export function GuestOnly({ children }) {
    const { user } = useSelector((s) => s.auth);
    const location = useLocation();
    if (user) return <Navigate to={location.state?.from || (user.role === 'admin' ? '/admin' : '/account')} replace />;
    return children;
}
