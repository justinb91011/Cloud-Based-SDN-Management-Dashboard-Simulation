import React, { useState, useEffect } from 'react';
import experimentApi from '../services/experimentApi';
import './ExperimentLauncher.css';

const ExperimentLauncher = ({ onExperimentStart, onExperimentComplete }) => {
    const [scenarios, setScenarios] = useState([]);
    const [selectedScenario, setSelectedScenario] = useState('');
    const [config, setConfig] = useState({
        tenantCount: 3,
        sliceCount: 3,
        loadLevel: 'medium', // low, medium, high
        aclPattern: 'default' // default, strict, open
    });
    const [isRunning, setIsRunning] = useState(false);
    const [status, setStatus] = useState(null); // { status: 'running', progress: 0 }
    const [error, setError] = useState(null);

    useEffect(() => {
        // Load scenarios on mount
        const loadScenarios = async () => {
            try {
                const list = await experimentApi.listScenarios();
                setScenarios(list);
                if (list.length > 0) setSelectedScenario(list[0].id);
            } catch (err) {
                console.error("Failed to load scenarios", err);
            }
        };
        loadScenarios();
    }, []);

    const handleConfigChange = (e) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: value }));
    };

    const handleRun = async () => {
        setIsRunning(true);
        setError(null);
        setStatus({ status: 'starting', progress: 0 });

        try {
            const experimentConfig = {
                scenarioId: selectedScenario,
                ...config
            };

            const { experimentId } = await experimentApi.runExperiment(experimentConfig);

            if (onExperimentStart) onExperimentStart(experimentId);

            // Start polling
            const pollInterval = setInterval(async () => {
                try {
                    const statusUpdate = await experimentApi.getExperimentStatus(experimentId);
                    setStatus(statusUpdate);

                    // Check for both 'done' and 'completed' statuses
                    if (statusUpdate.status === 'done' || statusUpdate.status === 'completed') {
                        clearInterval(pollInterval);
                        setIsRunning(false);
                        if (onExperimentComplete) onExperimentComplete(experimentId);
                    } else if (statusUpdate.status === 'failed') {
                        clearInterval(pollInterval);
                        setIsRunning(false);
                        setError("Experiment failed to complete.");
                    }
                } catch (err) {
                    console.error("Polling error", err);
                    // Don't stop polling immediately on one error, but maybe count them
                }
            }, 2000);

        } catch (err) {
            setIsRunning(false);
            setError("Failed to start experiment. Check backend connection.");
        }
    };

    return (
        <div className="experiment-launcher">
            <h2>Run New Experiment</h2>

            <div className="form-group">
                <label>Scenario Preset:</label>
                <select
                    value={selectedScenario}
                    onChange={(e) => setSelectedScenario(e.target.value)}
                    disabled={isRunning}
                >
                    {scenarios.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
                <p className="help-text">
                    {scenarios.find(s => s.id === selectedScenario)?.description}
                </p>
            </div>

            <div className="advanced-options">
                <h3>Configuration</h3>
                <div className="form-row">
                    <div className="form-group">
                        <label>Tenant Count:</label>
                        <input
                            type="number"
                            name="tenantCount"
                            value={config.tenantCount}
                            onChange={handleConfigChange}
                            min="1" max="10"
                            disabled={isRunning}
                        />
                    </div>
                    <div className="form-group">
                        <label>Slice Count:</label>
                        <input
                            type="number"
                            name="sliceCount"
                            value={config.sliceCount}
                            onChange={handleConfigChange}
                            min="1" max="10"
                            disabled={isRunning}
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Traffic Load:</label>
                        <select name="loadLevel" value={config.loadLevel} onChange={handleConfigChange} disabled={isRunning}>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>ACL Pattern:</label>
                        <select name="aclPattern" value={config.aclPattern} onChange={handleConfigChange} disabled={isRunning}>
                            <option value="default">Default</option>
                            <option value="strict">Strict (Deny All)</option>
                            <option value="open">Open (Allow All)</option>
                        </select>
                    </div>
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="actions">
                <button
                    className={`run-button ${isRunning ? 'running' : ''}`}
                    onClick={handleRun}
                    disabled={isRunning}
                >
                    {isRunning ? 'Experiment Running...' : 'Start Experiment'}
                </button>
            </div>

            {isRunning && status && (
                <div className="progress-bar-container">
                    <div className="progress-bar" style={{ width: `${status.progress}%` }}></div>
                    <span className="progress-text">{status.progress}% Complete</span>
                </div>
            )}
        </div>
    );
};

export default ExperimentLauncher;
