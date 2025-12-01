import React from 'react';
import './SummaryTable.css'; // We'll create this CSS file next

const SummaryTable = ({ summaryData }) => {
    // summaryData format: { sliceId: { avgLatency: 10, p95Latency: 15, avgThroughput: 100, aclHitRate: 0.95 }, ... }

    if (!summaryData || Object.keys(summaryData).length === 0) {
        return <div className="no-data">No summary data available</div>;
    }

    const sliceIds = Object.keys(summaryData);

    // Calculate overall stats for badges
    const totalSlices = sliceIds.length;
    const maxThroughput = Math.max(...Object.values(summaryData).map(d => d.avgThroughput));
    const avgLatency = (Object.values(summaryData).reduce((acc, curr) => acc + curr.avgLatency, 0) / totalSlices).toFixed(2);

    return (
        <div className="summary-section">
            <div className="summary-badges">
                <div className="badge">
                    <span className="badge-label">Total Slices</span>
                    <span className="badge-value">{totalSlices}</span>
                </div>
                <div className="badge">
                    <span className="badge-label">Max Throughput</span>
                    <span className="badge-value">{maxThroughput.toFixed(2)} Mbps</span>
                </div>
                <div className="badge">
                    <span className="badge-label">Avg Network Latency</span>
                    <span className="badge-value">{avgLatency} ms</span>
                </div>
            </div>

            <table className="summary-table">
                <thead>
                    <tr>
                        <th>Slice ID</th>
                        <th>Avg Latency (ms)</th>
                        <th>P95 Latency (ms)</th>
                        <th>Avg Throughput (Mbps)</th>
                        <th>ACL Hit Rate (%)</th>
                    </tr>
                </thead>
                <tbody>
                    {sliceIds.map(sliceId => {
                        const metrics = summaryData[sliceId];
                        return (
                            <tr key={sliceId}>
                                <td className="slice-id">{sliceId}</td>
                                <td>{metrics.avgLatency.toFixed(2)}</td>
                                <td>{metrics.p95Latency.toFixed(2)}</td>
                                <td>{metrics.avgThroughput.toFixed(2)}</td>
                                <td>{(metrics.aclHitRate * 100).toFixed(1)}%</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default SummaryTable;
