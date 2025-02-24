import React, { useState, useEffect } from 'react';
import './WidgetConfig.scss';

const WidgetConfig = ({ widget, buckets, selectedBuckets, onUpdate }) => {
  const [config, setConfig] = useState(widget.config || {
    bucket: '',
    timeField: 'timestamp', // Par défaut
    timeRange: '24h',
    aggregation: 'count',
    field: '', // Champ unique pour l'agrégation
    groupBy: '', // Changé de [] à ''
  });

  const timeRanges = [
    { value: '1h', label: 'Dernière heure' },
    { value: '6h', label: '6 heures' },
    { value: '12h', label: '12 heures' },
    { value: '24h', label: '24 heures' },
    { value: '7d', label: '7 jours' },
    { value: '30d', label: '30 jours' }
  ];

  const aggregationTypes = [
    { value: 'count', label: 'Nombre' },
    { value: 'sum', label: 'Somme' },
    { value: 'avg', label: 'Moyenne' },
    { value: 'min', label: 'Minimum' },
    { value: 'max', label: 'Maximum' }
  ];

  const handleChange = (field, value) => {
    const newConfig = { ...config, [field]: value };
    setConfig(newConfig);
    onUpdate(newConfig);
  };

  return (
    <div className="widget-config">
      <div className="config-section">
        <h4>Source de données</h4>
        <select 
          value={config.bucket}
          onChange={(e) => handleChange('bucket', e.target.value)}
        >
          <option value="">Sélectionner un bucket</option>
          {Array.from(selectedBuckets).map(bucketName => (
            <option key={bucketName} value={bucketName}>
              {bucketName}
            </option>
          ))}
        </select>
      </div>

      <div className="config-section">
        <h4>Période</h4>
        <select
          value={config.timeRange}
          onChange={(e) => handleChange('timeRange', e.target.value)}
        >
          {timeRanges.map(range => (
            <option key={range.value} value={range.value}>
              {range.label}
            </option>
          ))}
        </select>
      </div>

      <div className="config-section">
        <h4>Agrégation</h4>
        <select
          value={config.aggregation}
          onChange={(e) => handleChange('aggregation', e.target.value)}
        >
          {aggregationTypes.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>

        {config.aggregation !== 'count' && (
          <div className="field-select">
            <h4>Champ à agréger</h4>
            <select
              value={config.field}
              onChange={(e) => handleChange('field', e.target.value)}
            >
              <option value="">Sélectionner un champ</option>
              {/* Les champs seront ajoutés dynamiquement */}
            </select>
          </div>
        )}
      </div>

      <div className="config-section">
        <h4>Grouper par</h4>
        <select
          value={config.groupBy}
          onChange={(e) => handleChange('groupBy', e.target.value)}
        >
          <option value="">Aucun groupement</option>
          {/* Les champs seront ajoutés dynamiquement */}
        </select>
      </div>
    </div>
  );
};

export default WidgetConfig; 