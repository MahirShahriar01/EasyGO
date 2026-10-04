/** Split-screen card used by all auth pages. */
export default function AuthCard({ title, subtitle, children }) {
    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-xl-10">
                    <div className="card border-0 overflow-hidden shadow-soft">
                        <div className="row g-0">
                            <div className="col-lg-6 d-none d-lg-flex bg-gradient-brand p-5 flex-column justify-content-between">
                                <div>
                                    <i className="mdi mdi-airplane-takeoff display-4" />
                                    <h2 className="fw-800 mt-3">Your next adventure starts here.</h2>
                                    <p className="opacity-75">Members get exclusive prices, faster checkout and one place to manage every trip.</p>
                                </div>
                                <ul className="list-unstyled d-grid gap-2 mb-0">
                                    <li><i className="mdi mdi-check-circle me-2" />Save favourites & get price-drop deals</li>
                                    <li><i className="mdi mdi-check-circle me-2" />Manage, cancel & download e-tickets</li>
                                    <li><i className="mdi mdi-check-circle me-2" />10% off your first booking with WELCOME10</li>
                                </ul>
                            </div>
                            <div className="col-lg-6 p-4 p-md-5">
                                <h1 className="h3 fw-800 mb-1">{title}</h1>
                                {subtitle && <p className="text-soft mb-4">{subtitle}</p>}
                                {children}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
