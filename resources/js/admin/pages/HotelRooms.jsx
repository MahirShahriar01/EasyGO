import { Link, useParams } from 'react-router-dom';
import useApi from '../../hooks/useApi';
import ResourcePage from '../components/ResourcePage';
import { roomTypes } from '../resources';

/** Room-type manager scoped to one hotel. */
export default function HotelRooms() {
    const { id } = useParams();
    const { data: hotel } = useApi(`/admin/hotels/${id}`);

    return (
        <>
            <Link to="/admin/hotels" className="small d-inline-block mb-2"><i className="mdi mdi-arrow-left" /> All hotels</Link>
            <ResourcePage
                key={id}
                config={{ ...roomTypes, title: hotel ? `Rooms — ${hotel.name}` : 'Room types', subtitle: 'Prices, occupancy and inventory per room category' }}
                fixed={{ hotel_id: Number(id) }}
            />
        </>
    );
}
