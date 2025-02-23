import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setApiConfig } from '../../services/api';
import logo from '../../assets/logo.png';
import './Login.scss';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    apiUrl: '',
    apiKey: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [savedConnections, setSavedConnections] = useState([]);

  // Charger les connexions sauvegardées au démarrage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('savedConnections') || '[]');
    setSavedConnections(saved);
  }, []);

  // Sauvegarder une nouvelle connexion
  const saveConnection = (connection) => {
    const newConnections = [
      connection,
      ...savedConnections.filter(c => 
        c.apiUrl !== connection.apiUrl || c.apiKey !== connection.apiKey
      )
    ].slice(0, 5); // Garder uniquement les 5 dernières connexions

    localStorage.setItem('savedConnections', JSON.stringify(newConnections));
    setSavedConnections(newConnections);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.apiUrl || !formData.apiKey) {
        throw new Error('Veuillez remplir tous les champs');
      }

      const cleanApiUrl = formData.apiUrl.replace(/\/$/, '');
      await setApiConfig(cleanApiUrl, formData.apiKey);
      
      // Sauvegarder la connexion réussie
      saveConnection({
        apiUrl: cleanApiUrl,
        apiKey: formData.apiKey,
        timestamp: new Date().toISOString()
      });

      navigate('/');
    } catch (err) {
      setError(err.message || 'Erreur de configuration de l\'API');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickConnect = async (connection) => {
    setFormData({
      apiUrl: connection.apiUrl,
      apiKey: connection.apiKey
    });
    
    try {
      setLoading(true);
      setError('');
      await setApiConfig(connection.apiUrl, connection.apiKey);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Erreur de configuration de l\'API');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConnection = (index) => {
    const newConnections = savedConnections.filter((_, i) => i !== index);
    localStorage.setItem('savedConnections', JSON.stringify(newConnections));
    setSavedConnections(newConnections);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <img src={logo} alt="BucketFlow" className="logo" />
          <h1>BucketFlow</h1>
          <p>Configuration de l'API</p>
        </div>

        {savedConnections.length > 0 && (
          <div className="quick-connections">
            <h2>
              <i className="fas fa-history"></i>
              Connexions récentes
            </h2>
            <div className="connections-list">
              {savedConnections.map((connection, index) => (
                <div key={index} className="connection-item">
                  <div className="connection-info">
                    <span className="url" title={connection.apiUrl}>
                      {connection.apiUrl}
                    </span>
                    <span className="timestamp">
                      Dernière connexion : {new Date(connection.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="connection-actions">
                    <button
                      className="connect-btn"
                      onClick={() => handleQuickConnect(connection)}
                      disabled={loading}
                      title="Se connecter"
                    >
                      <i className="fas fa-plug"></i>
                      <span>Connecter</span>
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteConnection(index)}
                      disabled={loading}
                      title="Supprimer"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="apiUrl">
              <i className="fas fa-link"></i>
              URL de l'API
            </label>
            <input
              type="url"
              id="apiUrl"
              placeholder="https://api.example.com"
              value={formData.apiUrl}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                apiUrl: e.target.value
              }))}
            />
          </div>

          <div className="form-group">
            <label htmlFor="apiKey">
              <i className="fas fa-key"></i>
              Clé API
            </label>
            <input
              type="password"
              id="apiKey"
              placeholder="Votre clé API"
              value={formData.apiKey}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                apiKey: e.target.value
              }))}
            />
          </div>

          {error && (
            <div className="error-message">
              <i className="fas fa-exclamation-circle"></i>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className={`submit-button ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Configuration en cours...
              </>
            ) : (
              <>
                <i className="fas fa-sign-in-alt"></i>
                Configurer l'API
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login; 