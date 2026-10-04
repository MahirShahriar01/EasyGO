import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api/client';
import AdSlot from '../ads/AdSlot';
import Brand from './Brand';

export default function Footer() {
    const s = useSelector((st) => st.settings);
    const [email, setEmail] = useState('');
    const [busy, setBusy] = useState(false);

    const subscribe = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            const { data } = await api.post('/newsletter', { email });
            toast.success(data.message);
            setEmail('');
        } catch (err) {
            toast.error(err.fieldErrors?.email?.[0] || err.userMessage);
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            <div className="container mb-5">
                <AdSlot zone="footer_banner" />
            </div>
            <div className="container mb-n5 position-relative" style={{ zIndex: 2 }}>
                <div className="newsletter p-4 p-lg-5 shadow-soft">
                    <div className="row align-items-center g-4">
                        <div className="col-lg-6">
                            <h3 className="fw-800 mb-1">Get exclusive deals in your inbox</h3>
                            <p className="mb-0 opacity-75">Secret fares, flash sales and travel inspiration — no spam, unsubscribe anytime.</p>
                        </div>
                        <div className="col-lg-6">
                            <form className="d-flex gap-2 bg-white rounded-pill p-1" onSubmit={subscribe}>
                                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="form-control border-0 rounded-pill bg-transparent text-dark" placeholder="Your e-mail address" aria-label="E-mail" />
                                <button className="btn btn-dark rounded-pill px-4" disabled={busy}>{busy ? '…' : 'Subscribe'}</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
            <footer className="footer pt-5 mt-0">
                <div className="container pt-5">
                    <div className="row g-4 pt-4">
                        <div className="col-lg-4">
                            <Brand className="text-white mb-3" />
                            <p className="small">{s.about_text}</p>
                            <div className="d-flex gap-2">
                                {[['facebook_url', 'mdi-facebook'], ['instagram_url', 'mdi-instagram'], ['twitter_url', 'mdi-twitter'], ['youtube_url', 'mdi-youtube']].map(([k, icon]) => (
                                    <a key={k} href={s[k] || '#'} className="btn btn-icon btn-outline-light btn-sm" target="_blank" rel="noreferrer" aria-label={icon.replace('mdi-', '')}><i className={`mdi ${icon}`} /></a>
                                ))}
                            </div>
                        </div>
                        <div className="col-6 col-lg-2">
                            <h6 className="fw-bold mb-3">Book</h6>
                            <ul className="list-unstyled small d-grid gap-2">
                                <li><Link to="/hotels">Hotels & resorts</Link></li>
                                <li><Link to="/flights">Flights</Link></li>
                                <li><Link to="/buses">Bus tickets</Link></li>
                                <li><Link to="/tours">Tour packages</Link></li>
                                <li><Link to="/cars">Car rental</Link></li>
                            </ul>
                        </div>
                        <div className="col-6 col-lg-2">
                            <h6 className="fw-bold mb-3">Company</h6>
                            <ul className="list-unstyled small d-grid gap-2">
                                <li><Link to="/about">About us</Link></li>
                                <li><Link to="/contact">Contact</Link></li>
                                <li><Link to="/faq">FAQ</Link></li>
                                <li><Link to="/terms">Terms of service</Link></li>
                                <li><Link to="/privacy">Privacy policy</Link></li>
                            </ul>
                        </div>
                        <div className="col-lg-4">
                            <h6 className="fw-bold mb-3">Contact</h6>
                            <ul className="list-unstyled small d-grid gap-2">
                                <li><i className="mdi mdi-map-marker-outline me-2" />{s.contact_address}</li>
                                <li><i className="mdi mdi-phone-outline me-2" />{s.contact_phone}</li>
                                <li><i className="mdi mdi-email-outline me-2" />{s.contact_email}</li>
                            </ul>
                            <div className="d-flex flex-wrap gap-2 mt-3">
                                {['VISA', 'Mastercard', 'bKash', 'Nagad', 'Rocket'].map((p) => <span key={p} className="badge bg-secondary bg-opacity-25 text-light fw-semibold">{p}</span>)}
                            </div>
                        </div>
                    </div>
                    <hr className="border-secondary mt-5" />
                    <div className="d-flex flex-wrap justify-content-between small pb-4 gap-2">
                        <span>© {new Date().getFullYear()} {s.site_name}. All rights reserved.</span>
                        <span>Made with <i className="mdi mdi-heart text-danger" /> in Bangladesh</span>
                    </div>
                </div>
            </footer>
        </>
    );
}
