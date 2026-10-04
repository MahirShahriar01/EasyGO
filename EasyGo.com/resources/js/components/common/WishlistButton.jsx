import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { toggleWishlist } from '../../store/wishlistSlice';

/** Heart toggle for hotels / tours / cars. Guests are sent to sign in first. */
export default function WishlistButton({ type, id, className = 'wish-btn' }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const user = useSelector((s) => s.auth.user);
    const saved = useSelector((s) => s.wishlist.keys.includes(`${type}:${id}`));

    const onClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) {
            navigate('/login', { state: { from: location.pathname + location.search } });
            return;
        }
        const res = await dispatch(toggleWishlist({ type, id }));
        if (res.payload) toast.success(res.payload.message);
    };

    return (
        <button type="button" className={className} onClick={onClick} aria-pressed={saved} title={saved ? 'Remove from wishlist' : 'Save to wishlist'}>
            <i className={`mdi ${saved ? 'mdi-heart' : 'mdi-heart-outline'}`} />
        </button>
    );
}
