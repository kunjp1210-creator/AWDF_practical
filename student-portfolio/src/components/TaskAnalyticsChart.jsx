import React from 'react';

/**
 * TaskAnalyticsChart - A heavy analytical component containing SVG charts,
 * distribution calculations, and priority metrics.
 * Designed to be code-split and loaded on demand only when requested by the user.
 */
function TaskAnalyticsChart({ tasks = [] }) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const active = total - completed;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const lowCount = tasks.filter((t) => t.priority === 'low').length;
  const medCount = tasks.filter((t) => t.priority === 'medium').length;
  const highCount = tasks.filter((t) => t.priority === 'high').length;

  const lowPct = total > 0 ? Math.round((lowCount / total) * 100) : 0;
  const medPct = total > 0 ? Math.round((medCount / total) * 100) : 0;
  const highPct = total > 0 ? Math.round((highCount / total) * 100) : 0;

  // SVG Circular progress radius
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionRate / 100) * circumference;

  return (
    <div className="analytics-card glass-panel">
      <div className="analytics-header">
        <div>
          <h3 className="analytics-title">📊 Task Distribution & Performance Analytics</h3>
          <p className="analytics-subtitle">
            Component dynamically code-split and lazy-loaded via <code>React.lazy()</code>
          </p>
        </div>
        <span className="analytics-badge">Lazy Chunk Loaded</span>
      </div>

      <div className="analytics-grid">
        {/* Metric 1: Circular Completion Gauge */}
        <div className="analytics-gauge-box">
          <div className="circular-chart-wrapper">
            <svg className="circular-chart" viewBox="0 0 140 140" width="130" height="130">
              <circle
                className="circle-bg"
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="12"
              />
              <circle
                className="circle-progress"
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke="url(#gradientProgress)"
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform="rotate(-90 70 70)"
              />
              <defs>
                <linearGradient id="gradientProgress" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
            </svg>
            <div className="chart-center-text">
              <span className="chart-pct">{completionRate}%</span>
              <span className="chart-label">Complete</span>
            </div>
          </div>
          <div className="gauge-summary">
            <div>
              <span className="summary-val">{total}</span>
              <span className="summary-lbl">Total Tasks</span>
            </div>
            <div>
              <span className="summary-val" style={{ color: '#10b981' }}>{completed}</span>
              <span className="summary-lbl">Done</span>
            </div>
            <div>
              <span className="summary-val" style={{ color: '#22d3ee' }}>{active}</span>
              <span className="summary-lbl">Active</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Priority Breakdown Bars */}
        <div className="analytics-breakdown-box">
          <h4 className="breakdown-title">Priority Breakdown</h4>

          <div className="breakdown-item">
            <div className="breakdown-info">
              <span className="priority-tag priority-high">High Priority</span>
              <span className="breakdown-nums">{highCount} ({highPct}%)</span>
            </div>
            <div className="bar-track">
              <div className="bar-fill high" style={{ width: `${highPct}%` }}></div>
            </div>
          </div>

          <div className="breakdown-item">
            <div className="breakdown-info">
              <span className="priority-tag priority-medium">Medium Priority</span>
              <span className="breakdown-nums">{medCount} ({medPct}%)</span>
            </div>
            <div className="bar-track">
              <div className="bar-fill medium" style={{ width: `${medPct}%` }}></div>
            </div>
          </div>

          <div className="breakdown-item">
            <div className="breakdown-info">
              <span className="priority-tag priority-low">Low Priority</span>
              <span className="breakdown-nums">{lowCount} ({lowPct}%)</span>
            </div>
            <div className="bar-track">
              <div className="bar-fill low" style={{ width: `${lowPct}%` }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TaskAnalyticsChart;
