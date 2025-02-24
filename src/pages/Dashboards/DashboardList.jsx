import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchDashboards } from '../../services/dashboardsService';
import './Dashboards.scss';

const DashboardList = () => {
  const [dashboards, setDashboards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboards();
  }, []);

  const loadDashboards = async () => {
    try {
      const result = await fetchDashboards();
      setDashboards(result);
    } catch (error) {
      console.error('Erreur lors du chargement des dashboards:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboards-page">
      <div className="page-header">
        <h1>Tableaux de bord</h1>
        <Link to="/dashboards/new" className="create-btn">
          <i className="fas fa-plus"></i>
          Créer un tableau de bord
        </Link>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <span>Chargement des tableaux de bord...</span>
        </div>
      ) : (
        <div className="dashboard-grid">
          {dashboards.map(dashboard => (
            <Link 
              key={dashboard.id} 
              to={`/dashboards/${dashboard.id}`}
              className="dashboard-card"
            >
              <div className="card-header">
                <h3>{dashboard.name}</h3>
                <span className="date">
                  Créé le {new Date(dashboard.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="card-content">
                <div className="stats">
                  <div className="stat">
                    <i className="fas fa-chart-line"></i>
                    <span>{dashboard.widgets?.length || 0} widgets</span>
                  </div>
                  <div className="stat">
                    <i className="fas fa-database"></i>
                    <span>{dashboard.buckets?.length || 0} buckets</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardList; 