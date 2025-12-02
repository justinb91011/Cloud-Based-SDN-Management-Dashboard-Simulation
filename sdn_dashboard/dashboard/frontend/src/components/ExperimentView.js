import React, { useState } from 'react';
import ExperimentLauncher from './ExperimentLauncher';
import TimeSeriesChart from './TimeSeriesChart';
import SummaryTable from './SummaryTable';
import ComparisonView from './ComparisonView';
import experimentApi from '../services/experimentApi';
import './ExperimentView.css';

const ExperimentView = () => {
    const [activeTab, setActiveTab] = useState('launcher'); // launcher, results, comparison
    const [currentExperimentId, setCurrentExperimentId] = useState(null);
    const [metrics, setMetrics] = useState(null);
    const [chartMetric, setChartMetric] = useState('latency'); // latency, throughput
    const [experimentStatus, setExperimentStatus] = useState('idle'); // idle, running, completed

    // Poll for metrics if running
    React.useEffect(() => {
        let interval;
        if (experimentStatus === 'running' && currentExperimentId) {
            interval = setInterval(async () => {
                await loadMetrics(currentExperimentId);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [experimentStatus, currentExperimentId]);

    const handleExperimentStart = (id, isManual = false) => {
        setCurrentExperimentId(id);
        if (isManual) {
            setExperimentStatus('running');
            setActiveTab('results');
        } else {
            setExperimentStatus('running');
            // Stay on launcher for auto experiments
        }
    };

    const handleExperimentComplete = async (id) => {
        setCurrentExperimentId(id);
        setExperimentStatus('completed');
        setActiveTab('results');
        await loadMetrics(id);
    };

    const handleStopExperiment = async () => {
        if (currentExperimentId) {
            await experimentApi.stopExperiment(currentExperimentId);
            setExperimentStatus('completed');
        }
    };

    const loadMetrics = async (id) => {
        try {
            const data = await experimentApi.getExperimentMetrics(id);
            setMetrics(data);
        } catch (err) {
            console.error("Failed to load metrics", err);
        }
    };

    const handleExport = (format) => {
        if (currentExperimentId) {
            experimentApi.exportMetrics(currentExperimentId, format);
        }
    };

    return (
        <div className="experiment-view">
            <div className="experiment-nav">
                <button
                    className={activeTab === 'launcher' ? 'active' : ''}
                    onClick={() => setActiveTab('launcher')}
                >
                    New Experiment
                </button>
                <button
                    className={activeTab === 'results' ? 'active' : ''}
                    onClick={() => setActiveTab('results')}
                    disabled={!currentExperimentId}
                >
                    Results {experimentStatus === 'running' && '(Live)'}
                </button>
                <button
                    className={activeTab === 'comparison' ? 'active' : ''}
                    onClick={() => setActiveTab('comparison')}
                >
                    Compare
                </button>
            </div>

            <div className="experiment-content">
                {activeTab === 'launcher' && (
                    <ExperimentLauncher
                        onExperimentStart={handleExperimentStart}
                        onExperimentComplete={handleExperimentComplete}
                    />
                )}

                {activeTab === 'results' && metrics && (
                    <div className="results-view">
                        <div className="results-header">
                            <h2>
                                {experimentStatus === 'running' ? 'Live Session: ' : 'Experiment Results: '}
                                {currentExperimentId}
                            </h2>
                            <div className="export-buttons">
                                {experimentStatus === 'running' && (
                                    <button
                                        onClick={handleStopExperiment}
                                        style={{ backgroundColor: '#f44336', color: 'white', marginRight: '10px' }}
                                    >
                                        Stop Session
                                    </button>
                                )}
                                <button onClick={() => handleExport('csv')}>Download CSV</button>
                                <button onClick={() => handleExport('json')}>Download JSON</button>
                            </div>
                        </div>

                        <div className="chart-controls">
                            <label>Metric:</label>
                            <select value={chartMetric} onChange={(e) => setChartMetric(e.target.value)}>
                                <option value="latency">Latency (ms)</option>
                                <option value="throughput">Throughput (Mbps)</option>
                            </select>
                        </div>

                        <TimeSeriesChart
                            data={chartMetric === 'latency' ? (metrics.slicesLatency || metrics.slices) : metrics.slicesThroughput}
                            metric={chartMetric}
                            title={chartMetric === 'latency' ? 'Network Latency over Time' : 'Throughput over Time'}
                            yAxisLabel={chartMetric === 'latency' ? 'Latency (ms)' : 'Throughput (Mbps)'}
                        />

                        <SummaryTable summaryData={metrics.summary} />
                    </div>
                )}

                {activeTab === 'comparison' && (
                    <ComparisonView />
                )}
            </div>
        </div>
    );
};

export default ExperimentView;
