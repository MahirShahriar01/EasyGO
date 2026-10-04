import { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import api, { fieldError } from '../../api/client';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { setUser } from '../../store/authSlice';

export default function Profile() {
    useDocumentTitle('Profile & security');
    const dispatch = useDispatch();
    const user = useSelector((s) => s.auth.user);
    const fileRef = useRef(null);
    const [form, setForm] = useState({
        name: user.name || '', email: user.email || '', phone: user.phone || '', address: user.address || '',
        city: user.city || '', country: user.country || '', date_of_birth: user.date_of_birth || '', passport_no: user.passport_no || '',
    });
    const [pw, setPw] = useState({ current_password: '', password: '', password_confirmation: '' });
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState('');

    const saveProfile = async (e) => {
        e.preventDefault();
        setBusy('profile');
        setErrors({});
        try {
            const { data } = await api.put('/auth/profile', form);
            dispatch(setUser(data.user));
            toast.success(data.message);
        } catch (err) {
            setErrors(err.fieldErrors);
            toast.error(err.userMessage);
        } finally { setBusy(''); }
    };

    const savePassword = async (e) => {
        e.preventDefault();
        setBusy('password');
        setErrors({});
        try {
            const { data } = await api.put('/auth/password', pw);
            toast.success(data.message);
            setPw({ current_password: '', password: '', password_confirmation: '' });
        } catch (err) {
            setErrors(err.fieldErrors);
            toast.error(err.userMessage);
        } finally { setBusy(''); }
    };

    const uploadAvatar = async (file) => {
        if (!file) return;
        const body = new FormData();
        body.append('avatar', file);
        try {
            const { data } = await api.post('/auth/avatar', body);
            dispatch(setUser(data.user));
            toast.success(data.message);
        } catch (err) {
            toast.error(fieldError(err.fieldErrors, 'avatar') || err.userMessage);
        }
    };

    const field = (name, label, type = 'text', col = 'col-md-6') => (
        <div className={col}>
            <label className="form-label" htmlFor={name}>{label}</label>
            <input id={name} type={type} className={`form-control ${errors[name] ? 'is-invalid' : ''}`} value={form[name]} onChange={(e) => setForm({ ...form, [name]: e.target.value })} />
            <div className="invalid-feedback">{fieldError(errors, name)}</div>
        </div>
    );

    return (
        <>
            <h1 className="h3 fw-800 mb-4">Profile & security</h1>
            <div className="card border-0 p-4 mb-4">
                <div className="d-flex align-items-center gap-3 mb-4">
                    <img src={user.avatar_url} alt="" width="84" height="84" className="rounded-circle object-cover" />
                    <div>
                        <button className="btn btn-light btn-sm" onClick={() => fileRef.current.click()}><i className="mdi mdi-camera" /> Change photo</button>
                        <div className="small text-soft mt-1">JPG or PNG, max 2 MB.</div>
                        <input type="file" accept="image/*" hidden ref={fileRef} onChange={(e) => uploadAvatar(e.target.files[0])} />
                    </div>
                </div>
                <form onSubmit={saveProfile} className="row g-3">
                    {field('name', 'Full name')}
                    {field('email', 'E-mail', 'email')}
                    {field('phone', 'Mobile')}
                    {field('date_of_birth', 'Date of birth', 'date')}
                    {field('address', 'Address', 'text', 'col-12')}
                    {field('city', 'City', 'text', 'col-md-4')}
                    {field('country', 'Country', 'text', 'col-md-4')}
                    {field('passport_no', 'Passport / NID', 'text', 'col-md-4')}
                    <div className="col-12"><button className="btn btn-gradient" disabled={busy === 'profile'}>{busy === 'profile' ? 'Saving…' : 'Save changes'}</button></div>
                </form>
            </div>

            <div className="card border-0 p-4">
                <h5 className="fw-bold mb-3">Change password</h5>
                <form onSubmit={savePassword} className="row g-3">
                    {[['current_password', 'Current password'], ['password', 'New password'], ['password_confirmation', 'Confirm new password']].map(([k, l]) => (
                        <div className="col-md-4" key={k}>
                            <label className="form-label" htmlFor={k}>{l}</label>
                            <input id={k} type="password" className={`form-control ${errors[k] ? 'is-invalid' : ''}`} value={pw[k]} onChange={(e) => setPw({ ...pw, [k]: e.target.value })} required />
                            <div className="invalid-feedback">{fieldError(errors, k)}</div>
                        </div>
                    ))}
                    <div className="col-12"><button className="btn btn-outline-primary" disabled={busy === 'password'}>Update password</button></div>
                </form>
                <div className="small text-soft mt-3"><i className="mdi mdi-shield-lock-outline" /> Changing your password signs you out on all other devices.</div>
            </div>
        </>
    );
}
