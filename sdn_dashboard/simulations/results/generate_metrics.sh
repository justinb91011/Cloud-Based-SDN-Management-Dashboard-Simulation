#!/bin/bash

# Generate mock metrics.json for demonstration
# This simulates what the OMNeT++ simulation would generate

METRICS_FILE="$(dirname "$0")/metrics.json"

# Build up history array
HISTORY="["

for i in {1..100}; do
  TIMESTAMP=$(echo "scale=2; $i * 10" | bc)
  
  # Add comma separator except for first item
  if [ $i -gt 1 ]; then
    HISTORY="${HISTORY},"
  fi
  
  # Add history entry
  HISTORY="${HISTORY}{\"timestamp\":$TIMESTAMP,\"slices\":["
  HISTORY="${HISTORY}{\"sliceId\":1,\"latency\":$(echo "10 + $RANDOM % 10" | bc),\"throughput\":$(echo "50 + $RANDOM % 20" | bc)},"
  HISTORY="${HISTORY}{\"sliceId\":2,\"latency\":$(echo "15 + $RANDOM % 10" | bc),\"throughput\":$(echo "30 + $RANDOM % 15" | bc)},"
  HISTORY="${HISTORY}{\"sliceId\":3,\"latency\":$(echo "20 + $RANDOM % 10" | bc),\"throughput\":$(echo "40 + $RANDOM % 20" | bc)}"
  HISTORY="${HISTORY}]}"
  
  # Write current state with full history
  cat > "$METRICS_FILE" << EOF
{
  "timestamp": $TIMESTAMP,
  "slices": [
    {
      "sliceId": 1,
      "latency": $(echo "10 + $RANDOM % 10" | bc),
      "throughput": $(echo "50 + $RANDOM % 20" | bc)
    },
    {
      "sliceId": 2,
      "latency": $(echo "15 + $RANDOM % 10" | bc),
      "throughput": $(echo "30 + $RANDOM % 15" | bc)
    },
    {
      "sliceId": 3,
      "latency": $(echo "20 + $RANDOM % 10" | bc),
      "throughput": $(echo "40 + $RANDOM % 20" | bc)
    }
  ],
  "summary": {
    "1": { "avgLatency": $(echo "10 + $RANDOM % 5" | bc), "avgThroughput": $(echo "50 + $RANDOM % 10" | bc), "p95Latency": $(echo "15 + $RANDOM % 5" | bc), "aclHitRate": 0.95 },
    "2": { "avgLatency": $(echo "15 + $RANDOM % 5" | bc), "avgThroughput": $(echo "30 + $RANDOM % 10" | bc), "p95Latency": $(echo "20 + $RANDOM % 5" | bc), "aclHitRate": 0.92 },
    "3": { "avgLatency": $(echo "20 + $RANDOM % 5" | bc), "avgThroughput": $(echo "40 + $RANDOM % 10" | bc), "p95Latency": $(echo "25 + $RANDOM % 5" | bc), "aclHitRate": 0.88 }
  },
  "history": ${HISTORY}]
}
EOF
  
  sleep 1
done

echo "Metrics generation complete"
