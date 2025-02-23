import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchBuckets } from '../../services/api';
import './BucketList.scss';

const BucketList = () => {
  const [buckets, setBuckets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadBuckets = async () => {
      try {
        const data = await fetchBuckets();
        setBuckets(data.data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    loadBuckets();
  }, []);

  const filteredBuckets = buckets.filter(bucket => 
    bucket.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="loading-state">
      <div className="spinner"></div>
      <p>Chargement des buckets...</p>
    </div>
  );

  if (error) return (
    <div className="error-state">
      <i className="fas fa-exclamation-circle"></i>
      <p>Erreur: {error}</p>
    </div>
  );

  return (
    <div className="bucket-list">
      <div className="bucket-header">
        <div className="search-bar">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Rechercher un bucket..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="create-bucket">
          <i className="fas fa-plus"></i>
          Nouveau Bucket
        </button>
      </div>

      <div className="bucket-grid">
        {filteredBuckets.map((bucket) => (
          <Link to={`/bucket/${bucket.name}`} key={bucket.name} className="bucket-card">
            <div className="bucket-icon">
              <i className="fas fa-database"></i>
            </div>
            <div className="bucket-info">
              <h3>{bucket.name}</h3>
              <div className="bucket-stats">
                <span>
                  <i className="fas fa-layer-group"></i>
                  {bucket.entriesCount || 0} entrées
                </span>
                <span>
                  <i className="fas fa-clock"></i>
                  Mis à jour {bucket.lastUpdate || 'récemment'}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredBuckets.length === 0 && (
        <div className="empty-state">
          <i className="fas fa-database"></i>
          <p>Aucun bucket trouvé</p>
        </div>
      )}
    </div>
  );
};

export default BucketList; 