import React from 'react';

function Header({ name, title, themeColor }) {
  // Use themeColor dynamically as an inline style.
  // We can apply it to the border color and as a shadow/glow effect.
  const headerStyle = {
    borderColor: themeColor,
    boxShadow: `0 0 20px ${themeColor}15` // Adds a subtle 15% opacity neon glow
  };

  const textStyle = {
    color: themeColor
  };

  return (
    <header className="hero-wrapper" id="home">
      <div className="container">
        <span className="hero-subtitle">Welcome to my Portfolio</span>
        <h1 className="hero-title">
          Hi, I am <span style={textStyle}>{name}</span>
        </h1>
        <div className="glass-panel" style={{ ...headerStyle, padding: '2rem', display: 'inline-block', marginTop: '1rem', borderTop: `2px solid ${themeColor}` }}>
          <p className="hero-description" style={{ margin: 0, fontWeight: 500 }}>
            {title}
          </p>
        </div>
        <div style={{ marginTop: '3rem' }}>
          <a href="#about" className="hero-cta">
            Explore Portfolio
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <polyline points="19 12 12 19 5 12"></polyline>
            </svg>
          </a>
        </div>
      </div>
    </header>
  );
}

export default Header;
