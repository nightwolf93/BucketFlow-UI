import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { initApi, isApiConfigured } from './services/api';
import Layout from './components/Layout/Layout';
import Login from './pages/Login/Login';
import Home from './pages/Home/Home';
import BucketDetail from './pages/BucketDetail/BucketDetail';
import DashboardList from './pages/Dashboards/DashboardList';
import DashboardEditor from './pages/Dashboards/DashboardEditor';
import './App.scss';

// Composant d'animation pour wrapper les pages
const PageTransition = ({ children }) => {
  const pageVariants = {
    initial: {
      opacity: 0,
      y: 20
    },
    enter: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: 'easeOut'
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.2,
        ease: 'easeIn'
      }
    }
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="enter"
      exit="exit"
    >
      {children}
    </motion.div>
  );
};

const ProtectedRoute = ({ children }) => {
  if (!isApiConfigured()) {
    return <Navigate to="/login" replace />;
  }
  return <Layout>{children}</Layout>;
};

// Composant pour gérer les animations entre les routes
const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route 
          path="/login" 
          element={
            <PageTransition>
              <Login />
            </PageTransition>
          } 
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <PageTransition>
                <Home />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/bucket/:id"
          element={
            <ProtectedRoute>
              <PageTransition>
                <BucketDetail />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboards"
          element={
            <ProtectedRoute>
              <PageTransition>
                <DashboardList />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboards/new"
          element={
            <ProtectedRoute>
              <PageTransition>
                <DashboardEditor />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboards/:id"
          element={
            <ProtectedRoute>
              <PageTransition>
                <DashboardEditor />
              </PageTransition>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => {
  useEffect(() => {
    initApi();
  }, []);

  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
};

export default App;
