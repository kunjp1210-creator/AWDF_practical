import React from 'react';

/**
 * Meaningful fallback UI displayed by React Suspense while lazy-loaded
 * route chunks or heavy components are being downloaded over the network.
 */
function LoadingFallback({ message = 'Loading component chunk...' }) {
  return (
    <div className="lazy-loading-screen" role="status" aria-live="polite">
      <div className="lazy-fallback-card glass-panel">
        <div className="lazy-spinner-ring">
          <div className="lazy-spinner-inner"></div>
        </div>
        <h3 className="lazy-fallback-title">{message}</h3>
        <p className="lazy-fallback-subtitle">
          Code-split chunk requested via <code>React.lazy()</code> & <code>Suspense</code>
        </p>
        <div className="lazy-progress-bar">
          <div className="lazy-progress-indeterminate"></div>
        </div>
      </div>
    </div>
  );
}

export default LoadingFallback;
