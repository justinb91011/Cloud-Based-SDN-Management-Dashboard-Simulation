import React from 'react';
import './ConnectionStatus.css';

function ConnectionStatus({ status }) {
  const getStatusColor = () => {
    if (status.reconnecting) return 'orange';
    if (status.connected) return 'green';
    return 'red';
  };

  const getStatusText = () => {
    if (status.reconnecting) return 'Reconnecting...';
    if (status.connected) return 'Connected';
    return 'Disconnected';
  };

  return (
    <div className="connection-status">
      <div className={`status-indicator ${getStatusColor()}`}>
        <span className="status-dot"></span>
        <span className="status-text">{getStatusText()}</span>
      </div>

      {status.lastUpdate && (
        <div className="last-update">
          Last update: {status.lastUpdate.toLocaleTimeString()}
        </div>
      )}

      {status.error && (
        <div className="status-error">
          {status.error}
        </div>
      )}
    </div>
  );
}

export default ConnectionStatus;
