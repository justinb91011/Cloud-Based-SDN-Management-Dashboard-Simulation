import React, { useState } from 'react';
import './SlicePanel.css';

function SlicePanel({ slices, onCreateSlice, onDeleteSlice, onUpdateSlice, onSelectSlice, selectedSlice }) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingACL, setEditingACL] = useState(null);
  const [newSlice, setNewSlice] = useState({
    name: '',
    vlanId: '',
    bandwidth: '',
    hosts: [],
    isolated: true,
    acl: []
  });

  const [newACLRule, setNewACLRule] = useState({
    srcIP: '',
    dstIP: '',
    protocol: 'any',
    action: 'allow'
  });

  const handleCreate = () => {
    if (!newSlice.name || !newSlice.vlanId || !newSlice.bandwidth || newSlice.hosts.length === 0) {
      alert('Please fill in all required fields');
      return;
    }
    onCreateSlice(newSlice);
    setNewSlice({ name: '', vlanId: '', bandwidth: '', hosts: [], isolated: true, acl: [] });
    setShowCreateForm(false);
  };

  const handleHostsChange = (e) => {
    const hostsArray = e.target.value.split(',').map(h => h.trim()).filter(h => h);
    setNewSlice({ ...newSlice, hosts: hostsArray });
  };

  const handleAddACLRule = (sliceId) => {
    const slice = slices.find(s => s.id === sliceId);
    if (!slice) return;

    if (!newACLRule.srcIP || !newACLRule.dstIP) {
      alert('Please fill in source and destination IPs');
      return;
    }

    const updatedACL = [...(slice.acl || []), {
      ...newACLRule,
      id: Date.now()
    }];

    onUpdateSlice(sliceId, { ...slice, acl: updatedACL });
    setNewACLRule({ srcIP: '', dstIP: '', protocol: 'any', action: 'allow' });
  };

  const handleDeleteACLRule = (sliceId, ruleId) => {
    const slice = slices.find(s => s.id === sliceId);
    if (!slice) return;

    const updatedACL = (slice.acl || []).filter(rule => rule.id !== ruleId);
    onUpdateSlice(sliceId, { ...slice, acl: updatedACL });
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
              <p><strong>ACL Rules:</strong> {slice.acl ? slice.acl.length : 0}</p>
            </div>

            {selectedSlice?.id === slice.id && (
              <>
                {slice.hosts && (
                  <div className="slice-hosts">
                    <h4>Hosts:</h4>
                    <ul>
                      {slice.hosts.map((host, idx) => (
                        <li key={idx}>{host}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="slice-acl">
                  <h4>ACL Rules:</h4>
                  <button
                    className="edit-acl-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingACL(editingACL === slice.id ? null : slice.id);
                    }}
                  >
                    {editingACL === slice.id ? 'Hide ACL' : 'Edit ACL'}
                  </button>

                  {editingACL === slice.id && (
                    <div className="acl-editor">
                      <div className="acl-form">
                        <input
                          type="text"
                          placeholder="Source IP"
                          value={newACLRule.srcIP}
                          onChange={(e) => setNewACLRule({ ...newACLRule, srcIP: e.target.value })}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <input
                          type="text"
                          placeholder="Destination IP"
                          value={newACLRule.dstIP}
                          onChange={(e) => setNewACLRule({ ...newACLRule, dstIP: e.target.value })}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <select
                          value={newACLRule.protocol}
                          onChange={(e) => setNewACLRule({ ...newACLRule, protocol: e.target.value })}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="any">Any</option>
                          <option value="tcp">TCP</option>
                          <option value="udp">UDP</option>
                          <option value="icmp">ICMP</option>
                        </select>
                        <select
                          value={newACLRule.action}
                          onChange={(e) => setNewACLRule({ ...newACLRule, action: e.target.value })}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="allow">Allow</option>
                          <option value="deny">Deny</option>
                        </select>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddACLRule(slice.id);
                          }}
                        >
                          Add Rule
                        </button>
                      </div>

                      <div className="acl-list">
                        {(slice.acl || []).length === 0 ? (
                          <p className="no-acl">No ACL rules defined</p>
                        ) : (
                          (slice.acl || []).map((rule) => (
                            <div key={rule.id} className="acl-rule">
                              <span>{rule.srcIP} → {rule.dstIP}</span>
                              <span className="protocol">{rule.protocol}</span>
                              <span className={`action ${rule.action}`}>{rule.action}</span>
                              <button
                                className="delete-btn small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteACLRule(slice.id, rule.id);
                                }}
                              >
                                ×
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default SlicePanel;
