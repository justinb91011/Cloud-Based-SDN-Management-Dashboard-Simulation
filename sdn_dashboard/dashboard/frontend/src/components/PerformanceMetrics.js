import React, { useState, useEffect } from 'react';
import './PerformanceMetrics.css';

function PerformanceMetrics({ apiService }) {
  const [metrics, setMetrics] = useState(null);
  const [recentMetrics, setRecentMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchMetrics();

    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchMetrics();
      }, 5000); // Refresh every 5 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchMetrics = async () => {
    try {
      setError(null);
      const [statsResponse, recentResponse] = await Promise.all([
        fetch('http://localhost:3001/api/metrics'),
        fetch('http://localhost:3001/api/metrics/recent?count=50')
      ]);

      if (!statsResponse.ok || !recentResponse.ok) {
        throw new Error('Failed to fetch metrics');
      }

      const statsData = await statsResponse.json();
      const recentData = await recentResponse.json();

      setMetrics(statsData);
      setRecentMetrics(recentData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const renderMetricCard = (title, value, color = '#4CAF50') => (
    <div className="metric-card" style={{ borderLeftColor: color }}>
      <div className="metric-title">{title}</div>
      <div className="metric-value">{value}</div>
    </div>
  );

  const renderDetailedView = () => {
    if (!selectedMetric || !recentMetrics) return null;

    let data = [];
    let title = '';

    switch (selectedMetric) {
      case 'api':
        data = recentMetrics.apiResponseTimes;
        title = 'API Response Times';
        break;
      case 'websocket':
        data = recentMetrics.websocketLatency;
        title = 'WebSocket Latency';
        break;
      case 'slices':
        data = recentMetrics.sliceOperations;
        title = 'Slice Operations';
        break;
      case 'flows':
        data = recentMetrics.flowOperations;
        title = 'Flow Operations';
        break;
      case 'system':
        data = recentMetrics.systemLoad;
        title = 'System Load';
        break;
      default:
        return null;
    }

    return (
      <div className="detailed-view">
        <div className="detailed-header">
          <h3>{title}</h3>
          <button onClick={() => setSelectedMetric(null)}>Close</button>
        </div>
        <div className="detailed-content">
          <table>
            <thead>
              <tr>
                {selectedMetric === 'api' && (
                  <>
                    <th>Endpoint</th>
                    <th>Duration (ms)</th>
                    <th>Timestamp</th>
                  </>
                )}
                {selectedMetric === 'websocket' && (
                  <>
                    <th>Latency (ms)</th>
                    <th>Timestamp</th>
                  </>
                )}
                {(selectedMetric === 'slices' || selectedMetric === 'flows') && (
                  <>
                    <th>Operation</th>
                    <th>ID</th>
                    <th>Duration (ms)</th>
                    <th>Success</th>
                    <th>Timestamp</th>
                  </>
                )}
                {selectedMetric === 'system' && (
                  <>
                    <th>Heap Used (MB)</th>
                    <th>Heap Total (MB)</th>
                    <th>External (MB)</th>
                    <th>Timestamp</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {data.slice(-20).reverse().map((item, index) => (
                <tr key={index}>
                  {selectedMetric === 'api' && (
                    <>
                      <td>{item.endpoint}</td>
                      <td>{item.duration}</td>
                      <td>{formatTimestamp(item.timestamp)}</td>
                    </>
                  )}
                  {selectedMetric === 'websocket' && (
                    <>
                      <td>{item.latency}</td>
                      <td>{formatTimestamp(item.timestamp)}</td>
                    </>
                  )}
                  {(selectedMetric === 'slices' || selectedMetric === 'flows') && (
                    <>
                      <td className="operation">{item.operation}</td>
                      <td>{selectedMetric === 'slices' ? item.sliceId : item.flowId}</td>
                      <td>{item.duration}</td>
                      <td>
                        <span className={`status ${item.success ? 'success' : 'failed'}`}>
                          {item.success ? '✓' : '✗'}
                        </span>
                      </td>
                      <td>{formatTimestamp(item.timestamp)}</td>
                    </>
                  )}
                  {selectedMetric === 'system' && (
                    <>
                      <td>{(item.heapUsed / 1024 / 1024).toFixed(2)}</td>
                      <td>{(item.heapTotal / 1024 / 1024).toFixed(2)}</td>
                      <td>{(item.external / 1024 / 1024).toFixed(2)}</td>
                      <td>{formatTimestamp(item.timestamp)}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="performance-metrics loading">Loading metrics...</div>;
  }

  if (error) {
    return (
      <div className="performance-metrics error">
        <p>Error loading metrics: {error}</p>
        <button onClick={fetchMetrics}>Retry</button>
      </div>
    );
  }

  if (!metrics) {
    return <div className="performance-metrics">No metrics available</div>;
  }

  return (
    <div className="performance-metrics">
      <div className="metrics-header">
        <h2>Performance Metrics</h2>
        <div className="metrics-controls">
          <label>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh (5s)
          </label>
          <button onClick={fetchMetrics}>Refresh Now</button>
        </div>
      </div>

      <div className="metrics-grid">
        <div
          className="metric-card clickable"
          onClick={() => setSelectedMetric('api')}
          style={{ borderLeftColor: '#2196F3' }}
        >
          <div className="metric-title">Avg API Response Time</div>
          <div className="metric-value">{metrics.avgApiResponseTime}</div>
          <div className="metric-subtitle">Click for details</div>
        </div>

        <div
          className="metric-card clickable"
          onClick={() => setSelectedMetric('websocket')}
          style={{ borderLeftColor: '#9C27B0' }}
        >
          <div className="metric-title">Avg WebSocket Latency</div>
          <div className="metric-value">{metrics.avgWebSocketLatency}</div>
          <div className="metric-subtitle">Click for details</div>
        </div>

        <div
          className="metric-card clickable"
          onClick={() => setSelectedMetric('slices')}
          style={{ borderLeftColor: '#4CAF50' }}
        >
          <div className="metric-title">Slice Operations</div>
          <div className="metric-value">
            {metrics.sliceOperations.total} total
          </div>
          <div className="metric-details">
            <span className="success-rate">{metrics.sliceOperations.successRate}</span> success
          </div>
          <div className="metric-subtitle">Click for details</div>
        </div>

        <div
          className="metric-card clickable"
          onClick={() => setSelectedMetric('flows')}
          style={{ borderLeftColor: '#FF9800' }}
        >
          <div className="metric-title">Flow Operations</div>
          <div className="metric-value">
            {metrics.flowOperations.total} total
          </div>
          <div className="metric-details">
            <span className="success-rate">{metrics.flowOperations.successRate}</span> success
          </div>
          <div className="metric-subtitle">Click for details</div>
        </div>

        {metrics.memoryUsage && (
          <div
            className="metric-card clickable"
            onClick={() => setSelectedMetric('system')}
            style={{ borderLeftColor: '#F44336' }}
          >
            <div className="metric-title">System Memory</div>
            <div className="metric-value">
              {(metrics.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB
            </div>
            <div className="metric-details">
              Total: {(metrics.memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB
            </div>
            <div className="metric-subtitle">Click for details</div>
          </div>
        )}
      </div>

      {selectedMetric && renderDetailedView()}
    </div>
  );
}

export default PerformanceMetrics;
