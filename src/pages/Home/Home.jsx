import BucketList from '../../components/Bucket/BucketList';
import './Home.scss';

const Home = () => {
  return (
    <div className="home">
      <section className="hero">
        <h1>Gestion des Buckets</h1>
        <p className="subtitle">Gérez et analysez vos données efficacement</p>
        <div className="stats">
          <div className="stat-item">
            <span className="stat-value">{/* Nombre total de buckets */}</span>
            <span className="stat-label">Buckets actifs</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{/* Nombre total d'entrées */}</span>
            <span className="stat-label">Entrées totales</span>
          </div>
        </div>
      </section>
      <BucketList />
    </div>
  );
};

export default Home; 