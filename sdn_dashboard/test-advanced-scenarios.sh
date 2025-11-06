#!/bin/bash

# Advanced Multi-Tenant Testing Scenarios for Phase 8
# Tests performance, stress scenarios, and conflict resolution

BASE_URL="http://localhost:3001/api"
RESULTS_FILE="test-results-phase8-$(date +%Y%m%d-%H%M%S).log"

echo "==================================================================="
echo "Advanced SDN Dashboard Testing - Phase 8"
echo "==================================================================="
echo ""
echo "Test Results will be saved to: $RESULTS_FILE"
echo ""

# Initialize log file
cat > "$RESULTS_FILE" << EOF
Advanced SDN Dashboard Testing - Phase 8
Test Started: $(date)
=================================================================

EOF

# Helper function to log results
log_result() {
    echo "$1" | tee -a "$RESULTS_FILE"
}

# Helper function to time operations
time_operation() {
    local start=$(date +%s%N)
    eval "$1"
    local end=$(date +%s%N)
    local duration=$(( (end - start) / 1000000 ))
    echo "$duration"
}

# Helper function to create slice
create_slice() {
    local name=$1
    local vlan=$2
    local bandwidth=$3
    local hosts=$4

    curl -s -X POST "$BASE_URL/slices" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"$name\",
            \"vlanId\": $vlan,
            \"bandwidth\": $bandwidth,
            \"hosts\": $hosts,
            \"isolated\": true
        }"
}

# Helper function to delete slice
delete_slice() {
    local id=$1
    curl -s -X DELETE "$BASE_URL/slices/$id"
}

# Helper function to add flow
add_flow() {
    local src=$1
    local dst=$2
    local action=$3
    local slice_id=$4

    curl -s -X POST "$BASE_URL/flows" \
        -H "Content-Type: application/json" \
        -d "{
            \"srcIP\": \"$src\",
            \"dstIP\": \"$dst\",
            \"action\": \"$action\",
            \"priority\": 100,
            \"sliceId\": $slice_id
        }"
}

# Test 1: Rapid Slice Creation (Stress Test)
log_result ""
log_result "==================================================================="
log_result "Test 1: Rapid Slice Creation - 10 slices"
log_result "==================================================================="
log_result ""

total_time=0
slice_ids=()

for i in {1..10}; do
    log_result "Creating slice $i..."
    duration=$(time_operation "result=\$(create_slice \"RapidSlice$i\" $((100 + i)) 1000 '[\"10.0.$i.1\", \"10.0.$i.2\"]')")
    total_time=$((total_time + duration))
    log_result "  Duration: ${duration}ms"

    # Extract slice ID (assumes JSON response with "id" field)
    slice_id=$(echo "$result" | grep -o '"id":[0-9]*' | grep -o '[0-9]*')
    if [ -n "$slice_id" ]; then
        slice_ids+=($slice_id)
        log_result "  Created: Slice ID $slice_id"
    fi

    sleep 0.1 # Small delay between operations
done

avg_time=$((total_time / 10))
log_result ""
log_result "Total time: ${total_time}ms"
log_result "Average time per slice: ${avg_time}ms"
log_result ""

# Test 2: Rapid Slice Deletion
log_result "==================================================================="
log_result "Test 2: Rapid Slice Deletion"
log_result "==================================================================="
log_result ""

total_time=0

for slice_id in "${slice_ids[@]}"; do
    if [ -n "$slice_id" ]; then
        log_result "Deleting slice $slice_id..."
        duration=$(time_operation "delete_slice $slice_id")
        total_time=$((total_time + duration))
        log_result "  Duration: ${duration}ms"
        sleep 0.1
    fi
done

if [ ${#slice_ids[@]} -gt 0 ]; then
    avg_time=$((total_time / ${#slice_ids[@]}))
    log_result ""
    log_result "Total time: ${total_time}ms"
    log_result "Average time per deletion: ${avg_time}ms"
fi
log_result ""

# Test 3: VLAN Conflict Detection
log_result "==================================================================="
log_result "Test 3: VLAN Conflict Detection"
log_result "==================================================================="
log_result ""

log_result "Creating slice with VLAN 200..."
result1=$(create_slice "ConflictSlice1" 200 1000 '["10.0.1.1"]')
log_result "Result: $result1"

log_result ""
log_result "Attempting to create another slice with same VLAN 200..."
result2=$(create_slice "ConflictSlice2" 200 1000 '["10.0.2.1"]')
log_result "Result: $result2"
log_result ""

# Test 4: Concurrent Flow Operations
log_result "==================================================================="
log_result "Test 4: Concurrent Flow Operations - 20 flows"
log_result "==================================================================="
log_result ""

total_time=0
flow_ids=()

for i in {1..20}; do
    src="10.0.$((i % 3 + 1)).$((i % 10 + 1))"
    dst="10.0.$((i % 3 + 1)).$((i % 10 + 2))"
    action=$([ $((i % 2)) -eq 0 ] && echo "ALLOW" || echo "DROP")

    log_result "Creating flow $i: $src -> $dst ($action)..."
    duration=$(time_operation "result=\$(add_flow \"$src\" \"$dst\" \"$action\" 0)")
    total_time=$((total_time + duration))
    log_result "  Duration: ${duration}ms"

    sleep 0.05
done

avg_time=$((total_time / 20))
log_result ""
log_result "Total time: ${total_time}ms"
log_result "Average time per flow: ${avg_time}ms"
log_result ""

# Test 5: Bandwidth Reallocation Simulation
log_result "==================================================================="
log_result "Test 5: Bandwidth Reallocation"
log_result "==================================================================="
log_result ""

log_result "Creating slice with initial bandwidth 1000 Mbps..."
result=$(create_slice "BandwidthSlice" 300 1000 '["10.0.3.1", "10.0.3.2"]')
slice_id=$(echo "$result" | grep -o '"id":[0-9]*' | grep -o '[0-9]*')
log_result "Created: Slice ID $slice_id"

if [ -n "$slice_id" ]; then
    log_result ""
    log_result "Updating to 2000 Mbps..."
    duration=$(time_operation "curl -s -X PUT \"$BASE_URL/slices/$slice_id\" -H \"Content-Type: application/json\" -d '{\"bandwidth\": 2000}'")
    log_result "  Duration: ${duration}ms"

    log_result ""
    log_result "Updating to 500 Mbps..."
    duration=$(time_operation "curl -s -X PUT \"$BASE_URL/slices/$slice_id\" -H \"Content-Type: application/json\" -d '{\"bandwidth\": 500}'")
    log_result "  Duration: ${duration}ms"
fi
log_result ""

# Test 6: Metrics Collection Verification
log_result "==================================================================="
log_result "Test 6: Metrics Collection"
log_result "==================================================================="
log_result ""

log_result "Fetching metrics..."
metrics=$(curl -s "$BASE_URL/metrics")
log_result ""
log_result "Current Metrics:"
log_result "$metrics" | python3 -m json.tool 2>/dev/null || log_result "$metrics"
log_result ""

log_result "Fetching recent metrics (last 10 entries)..."
recent=$(curl -s "$BASE_URL/metrics/recent?count=10")
log_result ""
log_result "Recent Metrics Sample:"
log_result "$recent" | python3 -m json.tool 2>/dev/null || log_result "$recent"
log_result ""

# Test 7: Slice Isolation Test
log_result "==================================================================="
log_result "Test 7: Multi-Tenant Isolation"
log_result "==================================================================="
log_result ""

log_result "Creating Tenant A slice..."
result_a=$(create_slice "TenantA" 400 1500 '["10.0.4.1", "10.0.4.2", "10.0.4.3"]')
id_a=$(echo "$result_a" | grep -o '"id":[0-9]*' | grep -o '[0-9]*')
log_result "Created: Slice ID $id_a for Tenant A"

log_result ""
log_result "Creating Tenant B slice..."
result_b=$(create_slice "TenantB" 401 1500 '["10.0.5.1", "10.0.5.2", "10.0.5.3"]')
id_b=$(echo "$result_b" | grep -o '"id":[0-9]*' | grep -o '[0-9]*')
log_result "Created: Slice ID $id_b for Tenant B"

log_result ""
log_result "Creating Tenant C slice..."
result_c=$(create_slice "TenantC" 402 1500 '["10.0.6.1", "10.0.6.2", "10.0.6.3"]')
id_c=$(echo "$result_c" | grep -o '"id":[0-9]*' | grep -o '[0-9]*')
log_result "Created: Slice ID $id_c for Tenant C"

log_result ""
log_result "All tenants created. Verify isolation in dashboard."
log_result ""

# Test 8: API Response Time Test
log_result "==================================================================="
log_result "Test 8: API Response Time Benchmark"
log_result "==================================================================="
log_result ""

endpoints=(
    "GET /api/slices"
    "GET /api/flows"
    "GET /api/topology"
    "GET /api/statistics"
    "GET /api/health"
    "GET /api/status"
    "GET /api/metrics"
)

for endpoint_desc in "${endpoints[@]}"; do
    method=$(echo $endpoint_desc | cut -d' ' -f1)
    endpoint=$(echo $endpoint_desc | cut -d' ' -f2)

    log_result "Testing $endpoint_desc..."

    total=0
    iterations=5
    for i in $(seq 1 $iterations); do
        if [ "$method" = "GET" ]; then
            duration=$(time_operation "curl -s \"$BASE_URL${endpoint#/api}\" > /dev/null")
        fi
        total=$((total + duration))
    done

    avg=$((total / iterations))
    log_result "  Average response time: ${avg}ms (over $iterations requests)"
done
log_result ""

# Final Statistics
log_result "==================================================================="
log_result "Test Summary"
log_result "==================================================================="
log_result ""

final_stats=$(curl -s "$BASE_URL/statistics")
log_result "Final System Statistics:"
log_result "$final_stats" | python3 -m json.tool 2>/dev/null || log_result "$final_stats"
log_result ""

log_result "==================================================================="
log_result "Testing Complete!"
log_result "Results saved to: $RESULTS_FILE"
log_result "==================================================================="

echo ""
echo "Testing complete! Check $RESULTS_FILE for detailed results."
echo ""
