import CarCard from '../components/cards/CarCard';
import { CardSkeleton } from '../components/common/Feedback';
import ListingShell, { CheckList, FilterGroup, PriceInput } from '../components/search/ListingShell';
import useApi from '../hooks/useApi';
import useDocumentTitle from '../hooks/useDocumentTitle';
import useQueryState from '../hooks/useQueryState';

export default function Cars() {
    const [q, setQ, apiParams] = useQueryState({ car_type: [], sort: 'price_asc' });
    useDocumentTitle('Car rental');
    const { data, loading, error, reload } = useApi('/cars', apiParams);
    const keep = q.pickup_date && q.dropoff_date ? `?pickup_date=${q.pickup_date}&dropoff_date=${q.dropoff_date}` : '';

    return (
        <ListingShell
            tab="cars"
            title={q.location ? `Car rental in ${q.location}` : 'Rent a car'}
            query={q}
            items={data?.data}
            meta={data}
            loading={loading}
            error={error}
            onRetry={reload}
            onPage={(page) => setQ({ page }, { resetPage: false })}
            sort={q.sort}
            onSort={(sort) => setQ({ sort })}
            sortOptions={[['price_asc', 'Price: low to high'], ['price_desc', 'Price: high to low'], ['rating', 'Top rated']]}
            grid
            adEvery={6}
            skeleton={<div className="row g-4"><CardSkeleton count={6} cols="col-md-6 col-xl-4" /></div>}
            renderItem={(c) => <div className="col-md-6 col-xl-4"><CarCard car={c} query={keep} /></div>}
            filters={(
                <>
                    <FilterGroup title="Car type">
                        <CheckList options={[['micro', 'Micro / hatchback'], ['sedan', 'Sedan'], ['suv', 'SUV'], ['van', 'Van / minibus'], ['luxury', 'Luxury']]} value={q.car_type} onChange={(car_type) => setQ({ car_type })} />
                    </FilterGroup>
                    <FilterGroup title="Transmission">
                        <select className="form-select form-select-sm" value={q.transmission || ''} onChange={(e) => setQ({ transmission: e.target.value })}>
                            <option value="">Any</option><option value="automatic">Automatic</option><option value="manual">Manual</option>
                        </select>
                    </FilterGroup>
                    <FilterGroup title="Minimum seats">
                        <select className="form-select form-select-sm" value={q.seats || ''} onChange={(e) => setQ({ seats: e.target.value })}>
                            <option value="">Any</option>{[4, 5, 7, 12].map((n) => <option key={n} value={n}>{n}+</option>)}
                        </select>
                    </FilterGroup>
                    <FilterGroup title="Options">
                        <div className="form-check form-switch">
                            <input className="form-check-input" type="checkbox" id="driver" checked={q.with_driver === '1'} onChange={(e) => setQ({ with_driver: e.target.checked ? '1' : '' })} />
                            <label className="form-check-label small" htmlFor="driver">With driver</label>
                        </div>
                    </FilterGroup>
                    <FilterGroup title="Max price per day"><PriceInput value={q.max_price} onChange={(max_price) => setQ({ max_price })} /></FilterGroup>
                </>
            )}
        />
    );
}
