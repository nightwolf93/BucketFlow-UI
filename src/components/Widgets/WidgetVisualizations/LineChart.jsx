import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchWidgetData } from '../../../services/widgetDataService';

const LineChartWidget = ({ config }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log('Configuration du widget:', config); // Debug
        const result = await fetchWidgetData(config);
        console.log('Données reçues:', result); // Debug
        
        if (result && result.length > 0) {
          setData(result);
        } else {
          setError('Aucune donnée disponible pour la période sélectionnée');
        }
      } catch (err) {
        console.error('Erreur complète:', err); // Debug
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    if (config && config.bucket) {
      loadData();
    } else {
      console.log('Configuration incomplète:', config); // Debug
    }
  }, [config]);

  if (loading) {
    return (
      <div className="widget-loading">
        <i className="fas fa-spinner fa-spin"></i>
        <span>Chargement...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="widget-error">
        <i className="fas fa-exclamation-circle"></i>
        <span>{error}</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="widget-empty">
        <i className="fas fa-info-circle"></i>
        <span>Aucune donnée disponible</span>
      </div>
    );
  }

  console.log('Données avant rendu:', data); // Debug

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '300px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="timestamp"
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
          />
          <Tooltip />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={{ fill: '#3b82f6' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LineChartWidget; 