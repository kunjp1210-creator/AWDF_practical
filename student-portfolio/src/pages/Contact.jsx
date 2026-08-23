import React, { useState } from 'react';

function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  
  const [showTooltip, setShowTooltip] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const charLimit = 250;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'message' && value.length > charLimit) {
      return; // respect character limit
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleToggleTooltip = (e) => {
    e.preventDefault();
    setShowTooltip((prev) => !prev);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name && formData.email && formData.message) {
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setFormData({ name: '', email: '', message: '' });
      }, 5000); // clear after 5s
    }
  };

  const remainingChars = charLimit - formData.message.length;
  const charClass = remainingChars <= 20 ? (remainingChars === 0 ? 'char-count limit' : 'char-count warning') : 'char-count';

  return (
    <section id="contact" className="container" style={{ minHeight: '80vh' }}>
      <h2 className="section-title">Get In Touch</h2>
      <div className="contact-wrapper">
        <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
          {isSubmitted ? (
            <div style={{ padding: '4rem 2rem', textAlign: 'center', animation: 'fadeIn 0.4s ease-out' }}>
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="var(--accent-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1.5rem' }}>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <h3 style={{ fontSize: '1.6rem', marginBottom: '0.8rem' }}>Message Sent Successfully!</h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Thank you, <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{formData.name}</span>. Kunj will get back to you shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="contact-form">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Feel free to drop a message!</span>
                <div className="info-trigger-container">
                  <button onClick={handleToggleTooltip} className="info-btn" title="Show tips">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                  </button>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Help Tip</span>
                </div>
              </div>

              {showTooltip && (
                <div className="info-tooltip">
                  <strong>💡 Tip for reaching out:</strong>
                  <p style={{ marginTop: '0.25rem', fontSize: '0.8rem' }}>
                    Double-check your email address before sending so I can reply back! You can also use the GitHub/LinkedIn icons in the footer to connect with me on social platforms.
                  </p>
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your Name"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="message">Message</label>
                <textarea
                  id="message"
                  name="message"
                  rows="5"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Your message here..."
                  className="form-input"
                  style={{ resize: 'none' }}
                  required
                />
                <span className={charClass}>
                  {formData.message.length} / {charLimit} characters ({remainingChars} left)
                </span>
              </div>

              <button type="submit" className="form-submit-btn">
                Send Message
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

export default Contact;
