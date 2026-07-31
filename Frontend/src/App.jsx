import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import Grocery from './pages/Grocery';
import Transport from './pages/Transport';
import Lunch from './pages/Lunch';
import Garment from './pages/Garment';
import Furniture from './pages/Furniture';
import Rent from './pages/Rent';
import Cosmetic from './pages/Cosmetic';
import Takeout from './pages/Takeout';
import DatePage from './pages/DatePage';
import Budget from './pages/Budget';
import Wishlist from './pages/Wishlist';
import Other from './pages/Other';

const PrivateRoute = ({ children }) => {
  const { token } = useAuth();
  return token ? <Layout>{children}</Layout> : <Navigate to="/signin" />;
};

function AppRoutes() {
  const { token } = useAuth();
  return (
    <Routes>
      <Route path="/signin" element={token ? <Navigate to="/dashboard" /> : <SignIn />} />
      <Route path="/signup" element={token ? <Navigate to="/dashboard" /> : <SignUp />} />
      <Route path="/home" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/grocery" element={<PrivateRoute><Grocery /></PrivateRoute>} />
      <Route path="/transport" element={<PrivateRoute><Transport /></PrivateRoute>} />
      <Route path="/lunch" element={<PrivateRoute><Lunch /></PrivateRoute>} />
      <Route path="/garment" element={<PrivateRoute><Garment /></PrivateRoute>} />
      <Route path="/furniture" element={<PrivateRoute><Furniture /></PrivateRoute>} />
      <Route path="/rent" element={<PrivateRoute><Rent /></PrivateRoute>} />
      <Route path="/cosmetic" element={<PrivateRoute><Cosmetic /></PrivateRoute>} />
      <Route path="/takeout" element={<PrivateRoute><Takeout /></PrivateRoute>} />
      <Route path="/date" element={<PrivateRoute><DatePage /></PrivateRoute>} />
      <Route path="/budget" element={<PrivateRoute><Budget /></PrivateRoute>} />
      <Route path="/wishlist" element={<PrivateRoute><Wishlist /></PrivateRoute>} />
      <Route path="/other" element={<PrivateRoute><Other /></PrivateRoute>} />
      <Route path="*" element={<Navigate to={token ? "/home" : "/signin"} />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
