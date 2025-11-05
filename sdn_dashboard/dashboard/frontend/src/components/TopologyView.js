import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './TopologyView.css';

function TopologyView({ topology, slices, selectedSlice }) {
  const svgRef = useRef();

  useEffect(() => {
    if (!topology.nodes || topology.nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 800;
    const height = 600;

    svg.attr('width', width).attr('height', height);

    // Create groups
    const g = svg.append('g');

    // Color scale for slices
    const colorScale = d3.scaleOrdinal()
      .domain([0, 1, 2])
      .range(['#3498db', '#e74c3c', '#f39c12']);

    // Position nodes by type
    const nodesByType = {};
    topology.nodes.forEach(node => {
      if (!nodesByType[node.type]) {
        nodesByType[node.type] = [];
      }
      nodesByType[node.type].push(node);
    });

    // Layout nodes
    const positions = {};

    // Controller at top center
    if (nodesByType.controller) {
      nodesByType.controller.forEach((node, i) => {
        positions[node.id] = { x: width / 2, y: 50 };
      });
    }

    // Switches in middle - organized in layers
    if (nodesByType.switch) {
      const switches = nodesByType.switch;
      // Core switches (first 2)
      const coreY = 150;
      positions['coreSwitch1'] = { x: width / 3, y: coreY };
      positions['coreSwitch2'] = { x: (2 * width) / 3, y: coreY };

      // Aggregation switches (next 3)
      const aggY = 280;
      positions['aggSwitch0'] = { x: width / 4, y: aggY };
      positions['aggSwitch1'] = { x: width / 2, y: aggY };
      positions['aggSwitch2'] = { x: (3 * width) / 4, y: aggY };

      // Edge switches (last 3)
      const edgeY = 410;
      positions['edgeSwitch0'] = { x: width / 4, y: edgeY };
      positions['edgeSwitch1'] = { x: width / 2, y: edgeY };
      positions['edgeSwitch2'] = { x: (3 * width) / 4, y: edgeY };
    }

    // Hosts at bottom, grouped by slice
    if (nodesByType.host) {
      const hostY = 530;
      const hostsPerSlice = 4;

      nodesByType.host.forEach((node, i) => {
        const sliceId = node.slice !== undefined ? node.slice : 0;
        const posInSlice = i % hostsPerSlice;
        const sliceOffset = sliceId * (width / 3);

        positions[node.id] = {
          x: 100 + sliceOffset + posInSlice * 50,
          y: hostY
        };
      });
    }

    // Draw links (create default topology links if not provided)
    const links = [];

    // Controller to core switches
    if (positions['controller'] && positions['coreSwitch1']) {
      links.push({ source: 'controller', target: 'coreSwitch1' });
      links.push({ source: 'controller', target: 'coreSwitch2' });
    }

    // Core switches to aggregation switches
    ['aggSwitch0', 'aggSwitch1', 'aggSwitch2'].forEach(agg => {
      if (positions[agg]) {
        links.push({ source: 'coreSwitch1', target: agg });
        links.push({ source: 'coreSwitch2', target: agg });
      }
    });

    // Aggregation to edge switches
    links.push({ source: 'aggSwitch0', target: 'edgeSwitch0' });
    links.push({ source: 'aggSwitch1', target: 'edgeSwitch1' });
    links.push({ source: 'aggSwitch2', target: 'edgeSwitch2' });

    // Edge switches to hosts
    nodesByType.host && nodesByType.host.forEach((node, i) => {
      const sliceId = node.slice !== undefined ? node.slice : 0;
      links.push({ source: `edgeSwitch${sliceId}`, target: node.id });
    });

    // Draw links
    g.selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('x1', d => positions[d.source]?.x || 0)
      .attr('y1', d => positions[d.source]?.y || 0)
      .attr('x2', d => positions[d.target]?.x || 0)
      .attr('y2', d => positions[d.target]?.y || 0)
      .attr('stroke', '#ccc')
      .attr('stroke-width', 2);

    // Draw nodes
    const nodes = g.selectAll('circle')
      .data(topology.nodes)
      .enter()
      .append('circle')
      .attr('cx', d => positions[d.id]?.x || 0)
      .attr('cy', d => positions[d.id]?.y || 0)
      .attr('r', d => {
        if (d.type === 'controller') return 20;
        if (d.type === 'switch') return 15;
        return 10;
      })
      .attr('fill', d => {
        if (d.type === 'controller') return '#ff6b6b';
        if (d.type === 'switch') return '#4ecdc4';
        if (d.slice !== undefined) {
          if (selectedSlice && selectedSlice.id === d.slice + 1) {
            return colorScale(d.slice);
          }
          return '#95a5a6';
        }
        return '#95a5a6';
      })
      .attr('stroke', d => {
        if (selectedSlice && d.slice !== undefined && selectedSlice.id === d.slice + 1) {
          return '#2c3e50';
        }
        return '#fff';
      })
      .attr('stroke-width', d => {
        if (selectedSlice && d.slice !== undefined && selectedSlice.id === d.slice + 1) {
          return 3;
        }
        return 1;
      });

    // Add labels
    g.selectAll('text')
      .data(topology.nodes)
      .enter()
      .append('text')
      .attr('x', d => positions[d.id]?.x || 0)
      .attr('y', d => (positions[d.id]?.y || 0) + 25)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', '#333')
      .text(d => d.id);

    // Add zoom functionality
    const zoom = d3.zoom()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

  }, [topology, slices, selectedSlice]);

  return (
    <div className="topology-view">
      <h2>Network Topology</h2>
      <div className="topology-legend">
        <span className="legend-item">
          <span className="legend-circle controller"></span> Controller
        </span>
        <span className="legend-item">
          <span className="legend-circle switch"></span> Switch
        </span>
        <span className="legend-item">
          <span className="legend-circle host"></span> Host
        </span>
      </div>
      <svg ref={svgRef}></svg>
    </div>
  );
}

export default TopologyView;
