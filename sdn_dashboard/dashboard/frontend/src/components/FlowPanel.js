import React, { useState } from 'react';
import './FlowPanel.css';

function FlowPanel({ flows, slices, selectedSlice, onAddFlow, onDeleteFlow }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFlow, setNewFlow] = useState({
    srcIP: '',
    dstIP: '',
    action: 'forward',
    priority: 100,
    sliceId: selectedSlice?.id || 0
  });

  const filteredFlows = selectedSlice
    ? flows.filter(f => f.sliceId === selectedSlice.id)
    : flows;

  const handleAdd = () => {
    if (!newFlow.srcIP || !newFlow.dstIP || !newFlow.action) {
      alert('Please fill in all required fields');
      return;
    }
    onAddFlow({
      ...newFlow,
      sliceId: selectedSlice?.id || 0
    });
    setNewFlow({ srcIP: '', dstIP: '', action: 'forward', priority: 100, sliceId: 0 });
    setShowAddForm(false);
  };

  return (
    <div className="flow-panel">
      <h2>Flow Rules</h2>

      {selectedSlice && (
        <div className="slice-context">
          <p>Slice: <strong>{selectedSlice.name}</strong></p>
        </div>
      )}

      {!selectedSlice && (
        <div className="slice-context warning">
          <p>Please select a slice to manage flow rules</p>
        </div>
      )}

      <button
        className="add-btn"
        onClick={() => setShowAddForm(!showAddForm)}
        disabled={!selectedSlice}
      >
        {showAddForm ? 'Cancel' : '+ Add Flow'}
      </button>

      {showAddForm && (
        <div className="add-form">
          <h3>New Flow Rule</h3>
          <input
            type="text"
            placeholder="Source IP"
            value={newFlow.srcIP}
            onChange={(e) => setNewFlow({ ...newFlow, srcIP: e.target.value })}
          />
          <input
            type="text"
            placeholder="Destination IP"
            value={newFlow.dstIP}
            onChange={(e) => setNewFlow({ ...newFlow, dstIP: e.target.value })}
          />
          <select
            value={newFlow.action}
            onChange={(e) => setNewFlow({ ...newFlow, action: e.target.value })}
          >
            <option value="forward">Forward</option>
            <option value="drop">Drop</option>
            <option value="modify">Modify</option>
          </select>
          <input
            type="number"
            placeholder="Priority"
            value={newFlow.priority}
            onChange={(e) => setNewFlow({ ...newFlow, priority: parseInt(e.target.value) || 100 })}
          />
          <button onClick={handleAdd}>Add Flow</button>
        </div>
      )}

      <div className="flow-list">
        {filteredFlows.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Source IP</th>
                <th>Dest IP</th>
                <th>Action</th>
                <th>Priority</th>
                <th>Packets</th>
                <th>Bytes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFlows.map(flow => (
                <tr key={flow.id}>
                  <td>{flow.id}</td>
                  <td>{flow.srcIP}</td>
                  <td>{flow.dstIP || 'Any'}</td>
                  <td>{flow.action}</td>
                  <td>{flow.priority}</td>
                  <td>{flow.packets || 0}</td>
                  <td>{flow.bytes || 0}</td>
                  <td>
                    <button
                      className="delete-btn-small"
                      onClick={() => {
                        if (window.confirm('Delete this flow rule?')) {
                          onDeleteFlow(flow.id);
                        }
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="no-flows">No flow rules found</p>
        )}
      </div>
    </div>
  );
}

export default FlowPanel;
