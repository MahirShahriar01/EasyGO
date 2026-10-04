import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { fieldError } from '../../api/client';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { register } from '../../store/authSlice';
import AuthCard from './AuthCard';

/** Rough password strength (0-4) for the meter. */
const strength = (p) => [/.{8,}/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(p)).length;

export default function Register() {
    useDocumentTitle('Create account');
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', password_confirmation: '' });
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(false);
    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
    const score = strength(form.password);

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        setErrors({});
        const res = await dispatch(register(form));
        setBusy(false);
        if (res.error) {
            setErrors(res.payload?.errors || {});
            toast.error(res.payload?.message || 'Registration failed');
            return;
        }
        toast.success('Welcome to EasyGo! 🎉');
        navigate(location.state?.from || '/account', { replace: true });
    };

    const input = (name, label, type = 'text', extra = {}) => (
        <div className="mb-3">
            <label className="form-label" htmlFor={name}>{label}</label>
            <input id={name} type={type} className={`form-control ${errors[name] ? 'is-invalid' : ''}`} value={form[name]} onChange={set(name)} {...extra} />
            <div className="invalid-feedback">{fieldError(errors, name)}</div>
        </div>
    );

    return (
        <AuthCard title="Create your account" subtitle="It's free and takes less than a minute.">
            <form onSubmit={submit} noValidate>
                {input('name', 'Full name', 'text', { autoComplete: 'name', required: true })}
                <div className="row">
                    <div className="col-md-6">{input('email', 'E-mail', 'email', { autoComplete: 'email', required: true })}</div>
                    <div className="col-md-6">{input('phone', 'Mobile (optional)', 'tel', { autoComplete: 'tel' })}</div>
                </div>
                {input('password', 'Password', 'password', { autoComplete: 'new-password', required: true })}
                <div className="progress mb-1" style={{ height: 5 }}>
                    <div className={`progress-bar bg-${['danger', 'danger', 'warning', 'info', 'success'][score]}`} style={{ width: `${score * 25}%` }} />
                </div>
                <div className="small text-soft mb-3">At least 8 characters with letters and numbers.</div>
                {input('password_confirmation', 'Confirm password', 'password', { autoComplete: 'new-password', required: true })}
                <button className="btn btn-gradient btn-lg w-100 mt-2" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
            </form>
            <p className="text-center small mt-4 mb-0">Already have an account? <Link to="/login" state={location.state}>Sign in</Link></p>
        </AuthCard>
    );
}
