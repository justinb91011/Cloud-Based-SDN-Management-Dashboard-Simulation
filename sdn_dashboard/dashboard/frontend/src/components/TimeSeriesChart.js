import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TimeSeriesChart = ({ data, metric, title, yAxisLabel }) => {
    // data format: [{ timestamp: 10, sliceA: 50, sliceB: 60 }, ...]

    // Extract slice keys (excluding timestamp)
    const keys = data.length > 0 ? Object.keys(data[0]).filter(k => k !== 'timestamp') : [];

    // Color palette for slices
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00C49F'];

    return (
        <div className="chart-container" style={{ height: '300px', width: '100%', marginBottom: '20px' }}>
            <h3 style={{ textAlign: 'center', marginBottom: '10px' }}>{title}</h3>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={data}
                    margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                        dataKey="timestamp"
                        label={{ value: 'Time (s)', position: 'insideBottomRight', offset: -5 }}
                    />
                    <YAxis
                        label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip />
                    <Legend />
                    {keys.map((key, index) => (
                        <Line
                            key={key}
                            type="monotone"
                            dataKey={key}
                            stroke={colors[index % colors.length]}
                            activeDot={{ r: 8 }}
                            strokeWidth={2}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default TimeSeriesChart;
