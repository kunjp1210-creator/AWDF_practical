import React from 'react';
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <section className="container" style={{ minHeight: '75vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="notfound-wrapper glass-panel" style={{ padding: '4rem 3rem', borderRadius: '16px', maxWidth: '600px', width: '100%' }}>
        <div className="notfound-code">404</div>
        <h2 className="notfound-title">Page Not Found</h2>
        <p className="notfound-desc">
          Oops! The page you are looking for doesn't exist or has been relocated.
        </p>
        <Link to="/" className="hero-cta">
          Return to Dashboard
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </Link>
      </div>
    </section>
  );
}

export default NotFound;
