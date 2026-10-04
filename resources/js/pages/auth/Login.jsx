import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { fieldError } from '../../api/client';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { login } from '../../store/authSlice';
import AuthCard from './AuthCard';

export default function Login() {
    useDocumentTitle('Sign in');
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const [form, setForm] = useState({ email: '', password: '', remember: true });
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(false);
    const [show, setShow] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        setErrors({});
        const res = await dispatch(login(form));
        setBusy(false);
        if (res.error) {
            setErrors(res.payload?.errors || {});
            toast.error(res.payload?.message || 'Sign in failed');
            return;
        }
        toast.success(`Welcome back, ${res.payload.user.name.split(' ')[0]}!`);
        navigate(location.state?.from || (res.payload.user.role === 'admin' ? '/admin' : '/account'), { replace: true });
    };

    return (
        <AuthCard title="Welcome back" subtitle="Sign in to manage your bookings.">
            <form onSubmit={submit} noValidate>
                <div className="mb-3">
                    <label className="form-label" htmlFor="email">E-mail</label>
                    <input id="email" type="email" autoComplete="email" className={`form-control form-control-lg ${errors.email ? 'is-invalid' : ''}`} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                    <div className="invalid-feedback">{fieldError(errors, 'email')}</div>
                </div>
                <div className="mb-3">
                    <div className="d-flex justify-content-between"><label className="form-label" htmlFor="password">Password</label><Link to="/forgot-password" className="small">Forgot password?</Link></div>
                    <div className="input-group">
                        <input id="password" type={show ? 'text' : 'password'} autoComplete="current-password" className={`form-control form-control-lg ${errors.password ? 'is-invalid' : ''}`} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                        <button type="button" className="btn btn-outline-secondary" onClick={() => setShow(!show)} aria-label="Show password"><i className={`mdi ${show ? 'mdi-eye-off' : 'mdi-eye'}`} /></button>
                    </div>
                </div>
                <div className="form-check mb-4">
                    <input className="form-check-input" type="checkbox" id="remember" checked={form.remember} onChange={(e) => setForm({ ...form, remember: e.target.checked })} />
                    <label className="form-check-label small" htmlFor="remember">Keep me signed in for 30 days</label>
                </div>
                <button className="btn btn-gradient btn-lg w-100" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
            </form>
            <div className="alert alert-light border small mt-4 mb-0">
                <strong>Demo accounts</strong><br />
                Customer: <code>demo@easygo.com</code> / <code>password123</code><br />
                Admin: <code>admin@easygo.com</code> / <code>password123</code>
            </div>
            <p className="text-center small mt-4 mb-0">New to EasyGo? <Link to="/register" state={location.state}>Create an account</Link></p>
        </AuthCard>
    );
}
