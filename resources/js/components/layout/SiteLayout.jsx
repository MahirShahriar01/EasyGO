import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import InterstitialAd from '../ads/InterstitialAd';
import Footer from './Footer';
import Navbar from './Navbar';

/** Pages where a popup ad would interrupt a purchase. */
const NO_POPUP = ['/checkout', '/payment', '/booking', '/login', '/register'];

export default function SiteLayout() {
    const { pathname } = useLocation();
    const [showTop, setShowTop] = useState(false);

    useEffect(() => { window.scrollTo({ top: 0 }); }, [pathname]);
    useEffect(() => {
        const onScroll = () => setShowTop(window.scrollY > 600);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const allowPopup = !NO_POPUP.some((p) => pathname.startsWith(p));

    return (
        <>
            <a href="#main" className="visually-hidden-focusable position-absolute p-2 bg-white">Skip to content</a>
            <Navbar />
            <main id="main" className="page-fade" key={pathname}>
                <Outlet />
            </main>
            <Footer />
            {allowPopup && <InterstitialAd zone="interstitial_global" delay={2500} />}
            {showTop && (
                <button className="btn btn-gradient btn-icon back-to-top shadow" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top">
                    <i className="mdi mdi-arrow-up" />
                </button>
            )}
        </>
    );
}
