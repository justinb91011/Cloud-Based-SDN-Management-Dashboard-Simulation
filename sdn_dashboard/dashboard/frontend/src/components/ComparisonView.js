import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import experimentApi from '../services/experimentApi';
import './ComparisonView.css';

const ComparisonView = () => {
    const [experiments, setExperiments] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [comparisonData, setComparisonData] = useState([]);

    useEffect(() => {
        const fetchExperiments = async () => {
            try {
                const list = await experimentApi.getExperiments();
                setExperiments(list);
            } catch (err) {
                console.error("Failed to fetch experiments", err);
            }
        };
        fetchExperiments();
    }, []);

    const handleSelectionChange = (id) => {
        setSelectedIds(prev => {
            if (prev.includes(id)) {
                return prev.filter(x => x !== id);
            } else {
                if (prev.length >= 3) return prev; // Limit to 3
                return [...prev, id];
            }
        });
    };

    useEffect(() => {
        const updateComparisonData = async () => {
            if (selectedIds.length === 0) {
                setComparisonData([]);
                return;
            }

            const data = [];
            for (const id of selectedIds) {
                try {
                    const metrics = await experimentApi.getExperimentMetrics(id);
                    // Assuming metrics.summary contains { sliceId: { avgLatency, avgThroughput } }
                    // We'll aggregate for the whole experiment for simplicity, or pick one slice

                    // Calculate overall averages
                    const sliceIds = Object.keys(metrics.summary);
                    const totalLatency = sliceIds.reduce((acc, sid) => acc + metrics.summary[sid].avgLatency, 0);
                    const totalThroughput = sliceIds.reduce((acc, sid) => acc + metrics.summary[sid].avgThroughput, 0);

                    data.push({
                        name: `Exp ${id.substring(0, 6)}`,
                        avgLatency: totalLatency / sliceIds.length,
                        avgThroughput: totalThroughput / sliceIds.length
                    });
                } catch (err) {
                    console.error(`Failed to fetch metrics for ${id}`, err);
                }
            }
            setComparisonData(data);
        };

        updateComparisonData();
    }, [selectedIds]);

    return (
        <div className="comparison-view">
            <h3>Compare Experiments</h3>
            <div className="experiment-selector">
                <p>Select up to 3 experiments:</p>
                <div className="checkbox-list">
                    {experiments.map(exp => (
                        <label key={exp.id} className="checkbox-item">
                            <input
                                type="checkbox"
                                checked={selectedIds.includes(exp.id)}
                                onChange={() => handleSelectionChange(exp.id)}
                                disabled={!selectedIds.includes(exp.id) && selectedIds.length >= 3}
                            />
                            <span className="exp-name">{exp.name || exp.id}</span>
                            <span className="exp-date">{new Date(exp.timestamp).toLocaleDateString()}</span>
                        </label>
                    ))}
                </div>
            </div>

            {comparisonData.length > 0 && (
                <div className="charts-row">
                    <div className="chart-box">
                        <h4>Average Latency (ms)</h4>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={comparisonData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="avgLatency" fill="#8884d8" name="Latency" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="chart-box">
                        <h4>Average Throughput (Mbps)</h4>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={comparisonData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="avgThroughput" fill="#82ca9d" name="Throughput" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ComparisonView;
