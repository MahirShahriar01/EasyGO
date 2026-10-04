import TourCard from '../components/cards/TourCard';
import { CardSkeleton } from '../components/common/Feedback';
import ListingShell, { CheckList, FilterGroup, PriceInput } from '../components/search/ListingShell';
import useApi from '../hooks/useApi';
import useDocumentTitle from '../hooks/useDocumentTitle';
import useQueryState from '../hooks/useQueryState';

export default function Tours() {
    const [q, setQ, apiParams] = useQueryState({ category: [], sort: 'recommended' });
    useDocumentTitle('Tour packages');
    const { data, loading, error, reload } = useApi('/tours', apiParams);

    return (
        <ListingShell
            tab="tours"
            title={q.q ? `Tours: ${q.q}` : 'Holiday & tour packages'}
            query={q}
            items={data?.data}
            meta={data}
            loading={loading}
            error={error}
            onRetry={reload}
            onPage={(page) => setQ({ page }, { resetPage: false })}
            sort={q.sort}
            onSort={(sort) => setQ({ sort })}
            sortOptions={[['recommended', 'Recommended'], ['price_asc', 'Price: low to high'], ['price_desc', 'Price: high to low'], ['rating', 'Top rated'], ['duration', 'Shortest first']]}
            grid
            adEvery={6}
            skeleton={<div className="row g-4"><CardSkeleton count={6} cols="col-md-6 col-xl-4" /></div>}
            renderItem={(t) => <div className="col-md-6 col-xl-4"><TourCard tour={t} query={q.date ? `?date=${q.date}` : ''} /></div>}
            filters={(
                <>
                    <FilterGroup title="Trip style">
                        <CheckList options={[['beach', 'Beach'], ['adventure', 'Adventure'], ['culture', 'Culture & heritage'], ['honeymoon', 'Honeymoon'], ['family', 'Family'], ['wildlife', 'Wildlife']]} value={q.category} onChange={(category) => setQ({ category })} />
                    </FilterGroup>
                    <FilterGroup title="Duration">
                        {[['', '', 'Any'], ['1', '3', '1–3 days'], ['4', '5', '4–5 days'], ['6', '', '6+ days']].map(([min, max, label]) => (
                            <div className="form-check" key={label}>
                                <input className="form-check-input" type="radio" name="dur" id={`d${label}`} checked={(q.min_days || '') === min && (q.max_days || '') === max} onChange={() => setQ({ min_days: min, max_days: max })} />
                                <label className="form-check-label small" htmlFor={`d${label}`}>{label}</label>
                            </div>
                        ))}
                    </FilterGroup>
                    <FilterGroup title="Max price per person"><PriceInput value={q.max_price} onChange={(max_price) => setQ({ max_price })} /></FilterGroup>
                </>
            )}
        />
    );
}
