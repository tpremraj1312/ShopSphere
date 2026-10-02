import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles) {
    const isSellerApproved =
      allowedRoles.includes('seller') &&
      (user?.role === 'seller' || user?.sellerProfile?.status === 'approved');
    const hasRole = user && (allowedRoles.includes(user.role) || isSellerApproved);

    if (!hasRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <Outlet />;

};

export default ProtectedRoute;
