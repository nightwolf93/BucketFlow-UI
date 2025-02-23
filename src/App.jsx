import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { initApi, isApiConfigured } from './services/api';
import Layout from './components/Layout/Layout';
import Login from './pages/Login/Login';
import Home from './pages/Home/Home';
import BucketDetail from './pages/BucketDetail/BucketDetail';
import './App.scss';

const ProtectedRoute = ({ children }) => {
  if (!isApiConfigured()) {
    return <Navigate to="/login" replace />;
  }
  return <Layout>{children}</Layout>;
};

const App = () => {
  useEffect(() => {
    initApi();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bucket/:id"
          element={
            <ProtectedRoute>
              <BucketDetail />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
