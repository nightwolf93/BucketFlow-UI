import { useState } from 'react';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validation basique
      if (!formData.apiUrl || !formData.apiKey) {
        throw new Error('Veuillez remplir tous les champs');
      }

      // Nettoyage de l'URL (suppression du trailing slash)
      const cleanApiUrl = formData.apiUrl.replace(/\/$/, '');

      // Test de la configuration
      await setApiConfig(cleanApiUrl, formData.apiKey);
      
      // Redirection vers la page d'accueil
      navigate('/');
    } catch (err) {
      setError(err.message || 'Erreur de configuration de l\'API');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <img src={logo} alt="BucketFlow" className="logo" />
          <h1>BucketFlow</h1>
          <p>Configuration de l'API</p>
        </div>

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