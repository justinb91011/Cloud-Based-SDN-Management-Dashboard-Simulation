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

    const handleExperimentStart = (id) => {
        setCurrentExperimentId(id);
        // Stay on launcher while running, progress bar handles feedback
    };

    const handleExperimentComplete = async (id) => {
        setCurrentExperimentId(id);
        setActiveTab('results');
        await loadMetrics(id);
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
                    Results
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
                            <h2>Experiment Results: {currentExperimentId}</h2>
                            <div className="export-buttons">
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
