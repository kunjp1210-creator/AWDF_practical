import React from 'react';

function About() {
  return (
    <section id="about" className="container">
      <h2 className="section-title">About Me</h2>
      <div className="about-grid">
        <div className="about-content">
          <p>
            Hello! I'm <span className="about-highlight">Kunj Patel</span>, a passionate 5th-semester Computer Science and Technology student. I love designing and building modern web applications that combine clean code with visual excellence.
          </p>
          <p>
            My academic journey at Faculty of Technology and Engineering has helped me build solid foundations in frontend architectures, component systems, and software design principles. I thrive on translating complex layouts into responsive, interactive, and high-performance user experiences.
          </p>
          <p>
            When I'm not coding, I'm researching user experience patterns, experimenting with new framework features, or expanding my technical horizons.
          </p>
        </div>

        <div className="about-stats">
          <div className="stat-card glass-panel">
            <div className="stat-number">3+</div>
            <div className="stat-label">Projects Built</div>
          </div>
          <div className="stat-card glass-panel">
            <div className="stat-number">5th</div>
            <div className="stat-label">Semester</div>
          </div>
          <div className="stat-card glass-panel" style={{ gridColumn: 'span 2' }}>
            <div className="stat-number" style={{ color: 'var(--accent-primary)' }}>100%</div>
            <div className="stat-label">Commitment to Quality</div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default About;
