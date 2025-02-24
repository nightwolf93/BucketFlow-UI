import React, { useState } from 'react';
import WidgetConfig from './WidgetConfig';
import LineChartWidget from './WidgetVisualizations/LineChart';
import './Widget.scss';

const Widget = ({ widget, buckets, selectedBuckets, onUpdate, onDelete }) => {
  const [showConfig, setShowConfig] = useState(false);
  const [tempConfig, setTempConfig] = useState(widget.config);

  const handleConfigUpdate = (newConfig) => {
    setTempConfig(newConfig);
  };

  const handleSaveConfig = () => {
    onUpdate({
      ...widget,
      config: tempConfig,
      isConfigured: true // Ajout d'un flag pour indiquer que le widget est configuré
    });
    setShowConfig(false);
  };

  const handleCancelConfig = () => {
    setTempConfig(widget.config);
    setShowConfig(false);
  };

  const isConfigValid = () => {
    return tempConfig.bucket && tempConfig.timeRange;
  };

  const renderVisualization = () => {
    switch (widget.type) {
      case 'line':
        return <LineChartWidget data={[]} config={widget.config} />;
      case 'bar':
        return <div>Bar Chart (à implémenter)</div>;
      case 'pie':
        return <div>Pie Chart (à implémenter)</div>;
      case 'counter':
        return <div>Counter (à implémenter)</div>;
      default:
        return <div>Type de widget non supporté</div>;
    }
  };

  return (
    <div className="widget-container">
      <div className="widget-header">
        <input
          type="text"
          value={widget.title}
          onChange={(e) => onUpdate({ ...widget, title: e.target.value })}
          placeholder="Titre du widget"
        />
        <div className="widget-actions">
          <button 
            className="widget-action"
            onClick={() => setShowConfig(!showConfig)}
          >
            <i className="fas fa-cog"></i>
          </button>
          <button 
            className="widget-action delete"
            onClick={onDelete}
          >
            <i className="fas fa-trash"></i>
          </button>
        </div>
      </div>

      {showConfig ? (
        <div className="widget-config-container">
          <WidgetConfig
            widget={{ ...widget, config: tempConfig }}
            buckets={buckets}
            selectedBuckets={selectedBuckets}
            onUpdate={handleConfigUpdate}
          />
          <div className="config-actions">
            <button 
              className="cancel-btn"
              onClick={handleCancelConfig}
            >
              Annuler
            </button>
            <button 
              className="save-btn"
              onClick={handleSaveConfig}
              disabled={!isConfigValid()}
            >
              Appliquer
            </button>
          </div>
        </div>
      ) : (
        <div className="widget-content">
          {widget.isConfigured ? (
            <div className="widget-visualization" style={{ height: '300px' }}>
              {renderVisualization()}
            </div>
          ) : (
            <div className="widget-placeholder">
              <i className="fas fa-cog"></i>
              <span>Configuration requise</span>
              <button onClick={() => setShowConfig(true)}>Configurer</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Widget; 