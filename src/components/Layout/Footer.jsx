const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h4>À propos</h4>
            <p>BucketFlow - Solution de gestion de données professionnelle</p>
          </div>
          <div className="footer-section">
            <h4>Contact</h4>
            <p>support@bucketflow.com</p>
          </div>
          <div className="footer-section">
            <h4>Liens utiles</h4>
            <ul>
              <li><a href="/documentation">Documentation</a></li>
              <li><a href="/status">État du service</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 BucketFlow. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 