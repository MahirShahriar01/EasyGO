import { lazy, Suspense, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { GuestOnly, RequireAuth } from './components/common/Guards';
import { Spinner } from './components/common/Feedback';
import AccountLayout from './components/layout/AccountLayout';
import SiteLayout from './components/layout/SiteLayout';
import { fetchMe, sessionExpired } from './store/authSlice';
import { fetchSettings } from './store/settingsSlice';
import { fetchWishlistKeys } from './store/wishlistSlice';

import Home from './pages/Home';
import Hotels from './pages/Hotels';
import HotelDetail from './pages/HotelDetail';
import Flights from './pages/Flights';
import Buses from './pages/Buses';
import BusSeats from './pages/BusSeats';
import Tours from './pages/Tours';
import TourDetail from './pages/TourDetail';
import Cars from './pages/Cars';
import CarDetail from './pages/CarDetail';
import Destinations from './pages/Destinations';
import DestinationDetail from './pages/DestinationDetail';
import Checkout from './pages/Checkout';
import Payment from './pages/Payment';
import BookingSuccess from './pages/BookingSuccess';
import { About, Faq, Privacy, Terms } from './pages/StaticPages';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import AccountDashboard from './pages/account/Dashboard';
import MyBookings from './pages/account/Bookings';
import BookingDetail from './pages/account/BookingDetail';
import Wishlist from './pages/account/Wishlist';
import MyReviews from './pages/account/Reviews';
import Notifications from './pages/account/Notifications';
import Profile from './pages/account/Profile';

// Admin panel — loaded on demand.
const AdminApp = lazy(() => import('./admin/AdminApp'));

export default function App() {
    const dispatch = useDispatch();
    const theme = useSelector((s) => s.ui.theme);
    const user = useSelector((s) => s.auth.user);

    useEffect(() => {
        dispatch(fetchMe());
        dispatch(fetchSettings());
        const onExpired = () => dispatch(sessionExpired());
        window.addEventListener('easygo:unauthorized', onExpired);
        return () => window.removeEventListener('easygo:unauthorized', onExpired);
    }, [dispatch]);

    useEffect(() => { if (user) dispatch(fetchWishlistKeys()); }, [user, dispatch]);

    return (
        <>
            <Routes>
                <Route path="/admin/*" element={(
                    <RequireAuth admin>
                        <Suspense fallback={<Spinner className="min-vh-100 d-flex flex-column justify-content-center" label="Loading admin panel…" />}>
                            <AdminApp />
                        </Suspense>
                    </RequireAuth>
                )} />

                <Route element={<SiteLayout />}>
                    <Route index element={<Home />} />
                    <Route path="hotels" element={<Hotels />} />
                    <Route path="hotels/:slug" element={<HotelDetail />} />
                    <Route path="flights" element={<Flights />} />
                    <Route path="buses" element={<Buses />} />
                    <Route path="buses/:id" element={<BusSeats />} />
                    <Route path="tours" element={<Tours />} />
                    <Route path="tours/:slug" element={<TourDetail />} />
                    <Route path="cars" element={<Cars />} />
                    <Route path="cars/:id" element={<CarDetail />} />
                    <Route path="destinations" element={<Destinations />} />
                    <Route path="destinations/:slug" element={<DestinationDetail />} />
                    <Route path="about" element={<About />} />
                    <Route path="contact" element={<Contact />} />
                    <Route path="faq" element={<Faq />} />
                    <Route path="terms" element={<Terms />} />
                    <Route path="privacy" element={<Privacy />} />

                    <Route path="login" element={<GuestOnly><Login /></GuestOnly>} />
                    <Route path="register" element={<GuestOnly><Register /></GuestOnly>} />
                    <Route path="forgot-password" element={<GuestOnly><ForgotPassword /></GuestOnly>} />
                    <Route path="reset-password/:token" element={<ResetPassword />} />

                    <Route path="checkout" element={<RequireAuth><Checkout /></RequireAuth>} />
                    <Route path="payment/:reference" element={<RequireAuth><Payment /></RequireAuth>} />
                    <Route path="booking/success/:reference" element={<RequireAuth><BookingSuccess /></RequireAuth>} />

                    <Route path="account" element={<RequireAuth><AccountLayout /></RequireAuth>}>
                        <Route index element={<AccountDashboard />} />
                        <Route path="bookings" element={<MyBookings />} />
                        <Route path="bookings/:reference" element={<BookingDetail />} />
                        <Route path="wishlist" element={<Wishlist />} />
                        <Route path="reviews" element={<MyReviews />} />
                        <Route path="notifications" element={<Notifications />} />
                        <Route path="profile" element={<Profile />} />
                    </Route>
                    <Route path="*" element={<NotFound />} />
                </Route>
            </Routes>
            <ToastContainer position="top-right" autoClose={3500} theme={theme === 'dark' ? 'dark' : 'light'} newestOnTop />
        </>
    );
}
