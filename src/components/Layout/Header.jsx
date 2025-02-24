import { Link } from 'react-router-dom';
import logo from '../../assets/logo.png';
import './Layout.scss';

const Header = () => {
  return (
    <header className="header">
      <div className="container">
        <Link to="/" className="logo">
          <img src={logo} alt="BucketFlow" />
          <span>BucketFlow</span>
        </Link>
        <nav>
          <ul>
          <li>
              <Link to="/" className="nav-link">
                <i className="fas fa-home"></i>
                Accueil
              </Link>
            </li>
            <li>
              <Link to="/dashboards" className="nav-link">
                <i className="fas fa-chart-line"></i>
                Tableaux de bord
              </Link>
            </li>
            <li>
              <Link to="/documentation" className="nav-link">
                <i className="fas fa-book"></i>
                Documentation
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header; 