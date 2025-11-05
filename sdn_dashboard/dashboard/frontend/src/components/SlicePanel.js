import React, { useState } from 'react';
import './SlicePanel.css';

function SlicePanel({ slices, onCreateSlice, onDeleteSlice, onUpdateSlice, onSelectSlice, selectedSlice }) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSlice, setNewSlice] = useState({
    name: '',
    vlanId: '',
    bandwidth: '',
    hosts: [],
    isolated: true
  });

  const handleCreate = () => {
    if (!newSlice.name || !newSlice.vlanId || !newSlice.bandwidth || newSlice.hosts.length === 0) {
      alert('Please fill in all required fields');
      return;
    }
    onCreateSlice(newSlice);
    setNewSlice({ name: '', vlanId: '', bandwidth: '', hosts: [], isolated: true });
    setShowCreateForm(false);
  };

  const handleHostsChange = (e) => {
    const hostsArray = e.target.value.split(',').map(h => h.trim()).filter(h => h);
    setNewSlice({ ...newSlice, hosts: hostsArray });
  };

  return (
    <div className="slice-panel">
      <h2>Network Slices</h2>

      <button
        className="create-btn"
        onClick={() => setShowCreateForm(!showCreateForm)}
      >
        {showCreateForm ? 'Cancel' : '+ Create Slice'}
      </button>

      {showCreateForm && (
        <div className="create-form">
          <h3>New Slice</h3>
          <input
            type="text"
            placeholder="Slice Name"
            value={newSlice.name}
            onChange={(e) => setNewSlice({ ...newSlice, name: e.target.value })}
          />
          <input
            type="number"
            placeholder="VLAN ID"
            value={newSlice.vlanId}
            onChange={(e) => setNewSlice({ ...newSlice, vlanId: parseInt(e.target.value) || '' })}
          />
          <input
            type="number"
            placeholder="Bandwidth (Mbps)"
            value={newSlice.bandwidth}
            onChange={(e) => setNewSlice({ ...newSlice, bandwidth: parseFloat(e.target.value) || '' })}
          />
          <input
            type="text"
            placeholder="Hosts (comma-separated IPs)"
            onChange={handleHostsChange}
          />
          <label>
            <input
              type="checkbox"
              checked={newSlice.isolated}
              onChange={(e) => setNewSlice({ ...newSlice, isolated: e.target.checked })}
            />
            Isolated
          </label>
          <button onClick={handleCreate}>Create</button>
        </div>
      )}

      <div className="slice-list">
        {slices.map(slice => (
          <div
            key={slice.id}
            className={`slice-item ${selectedSlice?.id === slice.id ? 'selected' : ''}`}
            onClick={() => onSelectSlice(slice)}
          >
            <div className="slice-header">
              <h3>{slice.name}</h3>
              <button
                className="delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Delete slice ${slice.name}?`)) {
                    onDeleteSlice(slice.id);
                  }
                }}
              >
                ×
              </button>
            </div>
            <div className="slice-details">
              <p><strong>VLAN:</strong> {slice.vlanId}</p>
              <p><strong>Bandwidth:</strong> {slice.bandwidth} Mbps</p>
              <p><strong>Hosts:</strong> {slice.hosts ? slice.hosts.length : 0}</p>
              <p><strong>Isolated:</strong> {slice.isolated ? 'Yes' : 'No'}</p>
            </div>
            {selectedSlice?.id === slice.id && slice.hosts && (
              <div className="slice-hosts">
                <h4>Hosts:</h4>
                <ul>
                  {slice.hosts.map((host, idx) => (
                    <li key={idx}>{host}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default SlicePanel;
