import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="status-text">
    <h2>Page not found</h2>
    <p>The page you're looking for doesn't exist.</p>
    <Link to="/" className="nav-link">
      Go back home
    </Link>
  </div>
);

export default NotFound;