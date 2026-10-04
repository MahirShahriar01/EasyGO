import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import useDocumentTitle from '../hooks/useDocumentTitle';

function PageHero({ title, subtitle }) {
    return (
        <section className="hero hero-sm bg-gradient-brand" style={{ backgroundImage: 'none' }}>
            <div className="container"><h1 className="h2 fw-800">{title}</h1>{subtitle && <p className="opacity-75 mb-0">{subtitle}</p>}</div>
        </section>
    );
}

export function About() {
    useDocumentTitle('About us');
    const s = useSelector((st) => st.settings);
    return (
        <>
            <PageHero title={`About ${s.site_name}`} subtitle={s.site_tagline} />
            <div className="container py-5">
                <div className="row g-5 align-items-center">
                    <div className="col-lg-6">
                        <h2 className="section-title mb-3">Making travel simple for everyone</h2>
                        <p className="text-soft">{s.about_text}</p>
                        <p className="text-soft">We partner directly with hotels, airlines, bus operators, tour guides and car-rental fleets so you get real-time availability, honest prices and instant confirmation — with local payment methods like bKash and Nagad built in.</p>
                        <Link to="/contact" className="btn btn-gradient">Talk to us</Link>
                    </div>
                    <div className="col-lg-6">
                        <div className="row g-3">
                            {[['mdi-earth', '12+', 'Destinations'], ['mdi-office-building', '500+', 'Partner properties'], ['mdi-account-heart', '60k+', 'Happy travellers'], ['mdi-headset', '24/7', 'Support']].map(([i, n, l]) => (
                                <div className="col-6" key={l}><div className="card border-0 p-4 text-center h-100"><i className={`mdi ${i} display-6 text-primary`} /><div className="fs-3 fw-800">{n}</div><div className="small text-soft">{l}</div></div></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

const FAQS = [
    ['How do I know my booking is confirmed?', 'After payment you see a confirmation page and receive an e-mail with your booking reference. You can also find it any time under My account → My bookings.'],
    ['Which payment methods do you accept?', 'Visa, Mastercard and Amex cards plus bKash, Nagad and Rocket mobile wallets. Many hotels also offer “Pay at property”.'],
    ['How long is my reservation held before payment?', 'Unpaid bookings are held for 30 minutes. After that the rooms or seats are released automatically.'],
    ['Can I cancel my booking?', 'Yes — open the booking and click “Cancel booking”. The refund depends on the policy: refundable hotel rooms are free to cancel until 24h before check-in; bus tickets are fully refundable until 24h before departure (50% after); tours are fully refundable 7+ days before (50% from 2 days); refundable flights return 90% of the fare.'],
    ['How do coupon codes work?', 'Enter the code at checkout and press Apply. Each coupon may have a minimum spend, a maximum discount, an expiry date and may apply to one service only.'],
    ['Can I choose my bus seat?', 'Absolutely. Every bus has a live seat map — booked seats are greyed out and you can pick up to 6 seats.'],
    ['How do I write a review?', 'Reviews are verified: after a confirmed booking, open it from My bookings and submit your rating. Reviews are published after moderation.'],
];

export function Faq() {
    useDocumentTitle('FAQ');
    const [open, setOpen] = useState(0);
    return (
        <>
            <PageHero title="Frequently asked questions" subtitle="Everything you need to know about booking with us." />
            <div className="container py-5" style={{ maxWidth: 860 }}>
                <div className="accordion">
                    {FAQS.map(([q, a], i) => (
                        <div className="accordion-item border-0 mb-2 rounded-4 overflow-hidden shadow-sm" key={q}>
                            <h2 className="accordion-header">
                                <button className={`accordion-button fw-semibold ${open === i ? '' : 'collapsed'}`} onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>{q}</button>
                            </h2>
                            {open === i && <div className="accordion-body text-soft">{a}</div>}
                        </div>
                    ))}
                </div>
                <p className="text-center mt-4">Still have questions? <Link to="/contact">Contact support</Link></p>
            </div>
        </>
    );
}

function Legal({ title, sections }) {
    useDocumentTitle(title);
    return (
        <>
            <PageHero title={title} subtitle={`Last updated: ${new Date().getFullYear()}`} />
            <div className="container py-5" style={{ maxWidth: 860 }}>
                <div className="card border-0 p-4 p-lg-5">
                    {sections.map(([h, p]) => <section key={h} className="mb-4"><h5 className="fw-bold">{h}</h5><p className="text-soft mb-0">{p}</p></section>)}
                </div>
            </div>
        </>
    );
}

export const Terms = () => (
    <Legal title="Terms of service" sections={[
        ['1. Our role', 'EasyGo acts as an intermediary between travellers and travel service providers (hotels, airlines, bus operators, tour operators and car-rental companies). The contract for the travel service is between you and the provider.'],
        ['2. Bookings & payment', 'A booking is confirmed only after successful payment (or, where offered, a confirmed pay-at-property reservation). Prices include applicable taxes and service fees shown at checkout.'],
        ['3. Cancellations & refunds', 'Cancellation rules depend on the service and fare and are shown before you book. Refunds are issued to the original payment method.'],
        ['4. Your responsibilities', 'You must provide accurate traveller information and carry valid identification and travel documents.'],
        ['5. Reviews', 'Reviews must be honest, relate to a real booking and must not contain offensive content. We may moderate or remove reviews.'],
        ['6. Advertising', 'Some pages display clearly-labelled sponsored content. Advertisers are responsible for their offers.'],
    ]} />
);

export const Privacy = () => (
    <Legal title="Privacy policy" sections={[
        ['What we collect', 'Account details (name, e-mail, phone), booking and traveller information, and payment confirmations from our payment partners. We never store full card numbers.'],
        ['How we use it', 'To process bookings, send confirmations, provide support, prevent fraud and — with your consent — send offers.'],
        ['Advertising & analytics', 'Ads are served by our own system. We use an anonymous browser identifier and a one-way hash of your IP address to limit how often you see an ad and to measure performance. No data is sold to third parties.'],
        ['Your rights', 'You can access, correct or delete your data from your account or by contacting support.'],
        ['Security', 'Data is transmitted over HTTPS and passwords are hashed with bcrypt.'],
    ]} />
);
