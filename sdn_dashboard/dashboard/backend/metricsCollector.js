const fs = require('fs');
const path = require('path');

class MetricsCollector {
  constructor(resultsDir) {
    this.resultsDir = resultsDir;
    this.metricsFile = path.join(resultsDir, 'performance_metrics.json');
    this.metrics = {
      apiResponseTimes: [],
      websocketLatency: [],
      sliceOperations: [],
      flowOperations: [],
      systemLoad: [],
      timestamp: Date.now()
    };
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.metricsFile)) {
        const data = fs.readFileSync(this.metricsFile, 'utf8');
        this.metrics = JSON.parse(data);
      }
    } catch (err) {
      console.error('Error loading metrics:', err);
    }
  }

  save() {
    try {
      fs.writeFileSync(this.metricsFile, JSON.stringify(this.metrics, null, 2));
    } catch (err) {
      console.error('Error saving metrics:', err);
    }
  }

  recordAPIResponse(endpoint, duration) {
    this.metrics.apiResponseTimes.push({
      endpoint,
      duration,
      timestamp: Date.now()
    });

    // Keep only last 1000 entries
    if (this.metrics.apiResponseTimes.length > 1000) {
      this.metrics.apiResponseTimes.shift();
    }

    this.save();
  }

  recordWebSocketLatency(latency) {
    this.metrics.websocketLatency.push({
      latency,
      timestamp: Date.now()
    });

    if (this.metrics.websocketLatency.length > 1000) {
      this.metrics.websocketLatency.shift();
    }

    this.save();
  }

  recordSliceOperation(operation, sliceId, duration, success = true) {
    this.metrics.sliceOperations.push({
      operation, // 'create', 'delete', 'update'
      sliceId,
      duration,
      success,
      timestamp: Date.now()
    });

    if (this.metrics.sliceOperations.length > 500) {
      this.metrics.sliceOperations.shift();
    }

    this.save();
  }

  recordFlowOperation(operation, flowId, duration, success = true) {
    this.metrics.flowOperations.push({
      operation, // 'add', 'delete'
      flowId,
      duration,
      success,
      timestamp: Date.now()
    });

    if (this.metrics.flowOperations.length > 500) {
      this.metrics.flowOperations.shift();
    }

    this.save();
  }

  recordSystemLoad() {
    const used = process.memoryUsage();
    this.metrics.systemLoad.push({
      heapUsed: used.heapUsed,
      heapTotal: used.heapTotal,
      external: used.external,
      timestamp: Date.now()
    });

    if (this.metrics.systemLoad.length > 500) {
      this.metrics.systemLoad.shift();
    }

    this.save();
  }

  getStats() {
    const avgResponseTime = this.metrics.apiResponseTimes.length > 0
      ? this.metrics.apiResponseTimes.reduce((sum, m) => sum + m.duration, 0) / this.metrics.apiResponseTimes.length
      : 0;

    const avgWsLatency = this.metrics.websocketLatency.length > 0
      ? this.metrics.websocketLatency.reduce((sum, m) => sum + m.latency, 0) / this.metrics.websocketLatency.length
      : 0;

    const sliceOpsSuccess = this.metrics.sliceOperations.filter(op => op.success).length;
    const sliceOpsTotal = this.metrics.sliceOperations.length;
    const sliceSuccessRate = sliceOpsTotal > 0 ? (sliceOpsSuccess / sliceOpsTotal) * 100 : 100;

    const flowOpsSuccess = this.metrics.flowOperations.filter(op => op.success).length;
    const flowOpsTotal = this.metrics.flowOperations.length;
    const flowSuccessRate = flowOpsTotal > 0 ? (flowOpsSuccess / flowOpsTotal) * 100 : 100;

    return {
      avgApiResponseTime: avgResponseTime.toFixed(2) + 'ms',
      avgWebSocketLatency: avgWsLatency.toFixed(2) + 'ms',
      sliceOperations: {
        total: sliceOpsTotal,
        successful: sliceOpsSuccess,
        successRate: sliceSuccessRate.toFixed(1) + '%'
      },
      flowOperations: {
        total: flowOpsTotal,
        successful: flowOpsSuccess,
        successRate: flowSuccessRate.toFixed(1) + '%'
      },
      memoryUsage: this.metrics.systemLoad.length > 0
        ? this.metrics.systemLoad[this.metrics.systemLoad.length - 1]
        : null
    };
  }

  getRecentMetrics(count = 100) {
    return {
      apiResponseTimes: this.metrics.apiResponseTimes.slice(-count),
      websocketLatency: this.metrics.websocketLatency.slice(-count),
      sliceOperations: this.metrics.sliceOperations.slice(-count),
      flowOperations: this.metrics.flowOperations.slice(-count),
      systemLoad: this.metrics.systemLoad.slice(-count)
    };
  }
}

module.exports = MetricsCollector;
