import React from 'react';
import './Statistics.css';

function Statistics({ data }) {
  return (
    <div className="statistics">
      <div className="stat-item">
        <span className="stat-label">Slices:</span>
        <span className="stat-value">{data.totalSlices || 0}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Flows:</span>
        <span className="stat-value">{data.totalFlows || 0}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Hosts:</span>
        <span className="stat-value">{data.totalHosts || 0}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Switches:</span>
        <span className="stat-value">{data.totalSwitches || 0}</span>
      </div>
    </div>
  );
}

export default Statistics;
