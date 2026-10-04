import HotelCard from '../components/cards/HotelCard';
import { CardSkeleton } from '../components/common/Feedback';
import ListingShell, { CheckList, FilterGroup, PriceInput } from '../components/search/ListingShell';
import useApi from '../hooks/useApi';
import useDocumentTitle from '../hooks/useDocumentTitle';
import useQueryState from '../hooks/useQueryState';

const AMENITIES = [['wifi', 'Free Wi-Fi'], ['pool', 'Swimming pool'], ['parking', 'Free parking'], ['spa', 'Spa'], ['gym', 'Fitness centre'], ['restaurant', 'Restaurant'], ['beach', 'Beachfront'], ['airport_shuttle', 'Airport shuttle']];

export default function Hotels() {
    const [q, setQ, apiParams] = useQueryState({ stars: [], amenities: [], property_type: [], sort: 'recommended' });
    useDocumentTitle(q.q ? `Hotels in ${q.q}` : 'Hotels');
    const { data, loading, error, reload } = useApi('/hotels', apiParams);
    const keep = new URLSearchParams(Object.entries({ check_in: q.check_in, check_out: q.check_out, adults: q.adults, children: q.children, rooms: q.rooms }).filter(([, v]) => v)).toString();

    return (
        <ListingShell
            tab="hotels"
            title={q.q ? `Stays in ${q.q}` : 'Find your perfect stay'}
            query={q}
            items={data?.data}
            meta={data}
            loading={loading}
            error={error}
            onRetry={reload}
            onPage={(page) => setQ({ page }, { resetPage: false })}
            sort={q.sort}
            onSort={(sort) => setQ({ sort })}
            sortOptions={[['recommended', 'Recommended'], ['price_asc', 'Price: low to high'], ['price_desc', 'Price: high to low'], ['rating', 'Guest rating'], ['stars', 'Star rating']]}
            grid
            adEvery={6}
            skeleton={<div className="row g-4"><CardSkeleton count={6} cols="col-md-6 col-xl-4" /></div>}
            renderItem={(h) => <div className="col-md-6 col-xl-4"><HotelCard hotel={h} query={keep ? `?${keep}` : ''} /></div>}
            filters={(
                <>
                    <FilterGroup title="Max price per night"><PriceInput value={q.max_price} onChange={(max_price) => setQ({ max_price })} /></FilterGroup>
                    <FilterGroup title="Star rating">
                        <div className="d-flex flex-wrap gap-2">
                            {[5, 4, 3, 2].map((s) => (
                                <span key={s} className={`chip ${q.stars.includes(String(s)) ? 'active' : ''}`} onClick={() => setQ({ stars: q.stars.includes(String(s)) ? q.stars.filter((x) => x !== String(s)) : [...q.stars, String(s)] })}>
                                    {s} <i className="mdi mdi-star text-warning" />
                                </span>
                            ))}
                        </div>
                    </FilterGroup>
                    <FilterGroup title="Guest rating">
                        {[['4.5', 'Superb 9+'], ['4', 'Very good 8+'], ['3.5', 'Good 7+']].map(([v, l]) => (
                            <div className="form-check" key={v}>
                                <input className="form-check-input" type="radio" name="min_rating" id={`r${v}`} checked={q.min_rating === v} onChange={() => setQ({ min_rating: v })} />
                                <label className="form-check-label small" htmlFor={`r${v}`}>{l}</label>
                            </div>
                        ))}
                        {q.min_rating && <button className="btn btn-link btn-sm p-0" onClick={() => setQ({ min_rating: '' })}>Clear</button>}
                    </FilterGroup>
                    <FilterGroup title="Property type">
                        <CheckList options={[['hotel', 'Hotel'], ['resort', 'Resort'], ['apartment', 'Apartment'], ['villa', 'Villa'], ['guesthouse', 'Guesthouse']]} value={q.property_type} onChange={(property_type) => setQ({ property_type })} />
                    </FilterGroup>
                    <FilterGroup title="Amenities">
                        <CheckList options={AMENITIES} value={q.amenities} onChange={(amenities) => setQ({ amenities })} />
                    </FilterGroup>
                    <button className="btn btn-light w-100" onClick={() => setQ({ stars: [], amenities: [], property_type: [], max_price: '', min_rating: '' })}>Reset filters</button>
                </>
            )}
        />
    );
}
