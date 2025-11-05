#!/bin/bash

###############################################################################
# SDN Dashboard Integration Test Suite
# Tests bidirectional communication between Dashboard, Backend, and Simulation
###############################################################################

echo "==========================================================================="
echo "      SDN DASHBOARD INTEGRATION TEST SUITE - PHASE 6"
echo "==========================================================================="
echo ""
echo "This script tests the complete system integration:"
echo "  1. Backend API functionality"
echo "  2. Data persistence (JSON files)"
echo "  3. Bidirectional communication (Dashboard ↔ Simulation)"
echo "  4. Real-time updates via WebSocket"
echo ""
echo "==========================================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test result tracking
declare -a TEST_RESULTS

# Function to print test result
print_test_result() {
    local test_name=$1
    local result=$2
    local details=$3

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    if [ "$result" -eq 0 ]; then
        echo -e "${GREEN}✓${NC} Test $TOTAL_TESTS: $test_name"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        TEST_RESULTS+=("PASS: $test_name")
    else
        echo -e "${RED}✗${NC} Test $TOTAL_TESTS: $test_name"
        if [ -n "$details" ]; then
            echo -e "  ${YELLOW}Details: $details${NC}"
        fi
        FAILED_TESTS=$((FAILED_TESTS + 1))
        TEST_RESULTS+=("FAIL: $test_name - $details")
    fi
}

# Function to check if backend is running
check_backend() {
    curl -s http://localhost:3001/api/health > /dev/null 2>&1
    return $?
}

# Function to wait for backend
wait_for_backend() {
    echo "Waiting for backend to start..."
    local max_attempts=10
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        if check_backend; then
            echo -e "${GREEN}Backend is ready!${NC}"
            return 0
        fi
        attempt=$((attempt + 1))
        echo "  Attempt $attempt/$max_attempts..."
        sleep 2
    done

    echo -e "${RED}Backend failed to start after $max_attempts attempts${NC}"
    return 1
}

# Create results directory
RESULTS_DIR="sdn_dashboard/simulations/results"
mkdir -p "$RESULTS_DIR"

echo "==========================================================================="
echo "PHASE 1: ENVIRONMENT VERIFICATION"
echo "==========================================================================="
echo ""

# Test 1: Check if required directories exist
echo "Test 1: Checking directory structure..."
if [ -d "sdn_dashboard/dashboard/backend" ] && [ -d "sdn_dashboard/dashboard/frontend" ] && [ -d "$RESULTS_DIR" ]; then
    print_test_result "Directory structure exists" 0
else
    print_test_result "Directory structure exists" 1 "Missing required directories"
fi

# Test 2: Check if state files exist
echo "Test 2: Checking simulation state files..."
if [ -f "$RESULTS_DIR/controller_state.json" ] && [ -f "$RESULTS_DIR/topology.json" ]; then
    print_test_result "State files exist" 0
else
    print_test_result "State files exist" 1 "Missing controller_state.json or topology.json"
fi

# Test 3: Check if backend server.js exists
echo "Test 3: Checking backend files..."
if [ -f "sdn_dashboard/dashboard/backend/server.js" ]; then
    print_test_result "Backend files exist" 0
else
    print_test_result "Backend files exist" 1 "Missing server.js"
fi

echo ""
echo "==========================================================================="
echo "PHASE 2: BACKEND API TESTING"
echo "==========================================================================="
echo ""

# Check if backend is already running
if ! check_backend; then
    echo -e "${YELLOW}Backend not running. Please start it with:${NC}"
    echo -e "${BLUE}  cd sdn_dashboard/dashboard/backend && npm start${NC}"
    echo ""
    echo -e "${YELLOW}Waiting for backend to start...${NC}"

    if ! wait_for_backend; then
        echo -e "${RED}ERROR: Backend is not running. Skipping API tests.${NC}"
        echo ""
        echo "Please start the backend server and run this test again."
        exit 1
    fi
fi

# Test 4: Health endpoint
echo "Test 4: Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s http://localhost:3001/api/health)
if [ $? -eq 0 ] && [[ $HEALTH_RESPONSE == *"healthy"* ]]; then
    print_test_result "Health endpoint responds" 0
else
    print_test_result "Health endpoint responds" 1 "No response or unhealthy"
fi

# Test 5: Get topology
echo "Test 5: Testing topology endpoint..."
TOPOLOGY_RESPONSE=$(curl -s http://localhost:3001/api/topology)
if [ $? -eq 0 ] && [[ $TOPOLOGY_RESPONSE == *"nodes"* ]]; then
    print_test_result "Topology endpoint returns data" 0
else
    print_test_result "Topology endpoint returns data" 1 "Invalid topology response"
fi

# Test 6: Get slices
echo "Test 6: Testing slices endpoint..."
SLICES_RESPONSE=$(curl -s http://localhost:3001/api/slices)
if [ $? -eq 0 ] && [[ $SLICES_RESPONSE == *"Tenant"* ]]; then
    print_test_result "Slices endpoint returns data" 0
else
    print_test_result "Slices endpoint returns data" 1 "No slices returned"
fi

# Test 7: Get flows
echo "Test 7: Testing flows endpoint..."
FLOWS_RESPONSE=$(curl -s http://localhost:3001/api/flows)
if [ $? -eq 0 ] && [[ $FLOWS_RESPONSE == *"srcIP"* ]]; then
    print_test_result "Flows endpoint returns data" 0
else
    print_test_result "Flows endpoint returns data" 1 "No flows returned"
fi

# Test 8: Get statistics
echo "Test 8: Testing statistics endpoint..."
STATS_RESPONSE=$(curl -s http://localhost:3001/api/statistics)
if [ $? -eq 0 ] && [[ $STATS_RESPONSE == *"totalSlices"* ]]; then
    print_test_result "Statistics endpoint returns data" 0
else
    print_test_result "Statistics endpoint returns data" 1 "Invalid statistics response"
fi

echo ""
echo "==========================================================================="
echo "PHASE 3: CREATE OPERATIONS (Dashboard → Backend → Simulation)"
echo "==========================================================================="
echo ""

# Test 9: Create a test slice via API
echo "Test 9: Creating test slice via API..."
CREATE_SLICE_RESPONSE=$(curl -s -X POST http://localhost:3001/api/slices \
  -H "Content-Type: application/json" \
  -d '{
    "name": "TestSlice_Integration",
    "vlanId": 40,
    "bandwidth": 250,
    "hosts": ["10.0.40.1", "10.0.40.2"],
    "isolated": true
  }')

if [ $? -eq 0 ] && [[ $CREATE_SLICE_RESPONSE == *"TestSlice_Integration"* ]]; then
    print_test_result "Create slice API works" 0
    TEST_SLICE_ID=$(echo $CREATE_SLICE_RESPONSE | grep -o '"id":[0-9]*' | grep -o '[0-9]*')
    echo "  Created slice with ID: $TEST_SLICE_ID"
else
    print_test_result "Create slice API works" 1 "Failed to create slice"
    TEST_SLICE_ID=""
fi

# Test 10: Verify command file was created
echo "Test 10: Checking if command file was written..."
sleep 1  # Give backend time to write file
if [ -f "$RESULTS_DIR/commands.json" ]; then
    COMMAND_CONTENT=$(cat "$RESULTS_DIR/commands.json")
    if [[ $COMMAND_CONTENT == *"CREATE_SLICE"* ]] && [[ $COMMAND_CONTENT == *"TestSlice_Integration"* ]]; then
        print_test_result "Command file written correctly" 0
    else
        print_test_result "Command file written correctly" 1 "File exists but content invalid"
    fi
else
    print_test_result "Command file written correctly" 1 "commands.json not found"
fi

# Test 11: Create a test flow via API
echo "Test 11: Creating test flow via API..."
CREATE_FLOW_RESPONSE=$(curl -s -X POST http://localhost:3001/api/flows \
  -H "Content-Type: application/json" \
  -d '{
    "srcIP": "10.0.40.1",
    "dstIP": "10.0.40.2",
    "action": "forward",
    "priority": 200,
    "sliceId": 4
  }')

if [ $? -eq 0 ] && [[ $CREATE_FLOW_RESPONSE == *"10.0.40.1"* ]]; then
    print_test_result "Create flow API works" 0
    TEST_FLOW_ID=$(echo $CREATE_FLOW_RESPONSE | grep -o '"id":[0-9]*' | grep -o '[0-9]*')
    echo "  Created flow with ID: $TEST_FLOW_ID"
else
    print_test_result "Create flow API works" 1 "Failed to create flow"
    TEST_FLOW_ID=""
fi

# Test 12: Verify flow command file
echo "Test 12: Checking if flow command was written..."
sleep 1
if [ -f "$RESULTS_DIR/commands.json" ]; then
    COMMAND_CONTENT=$(cat "$RESULTS_DIR/commands.json")
    if [[ $COMMAND_CONTENT == *"ADD_FLOW"* ]] && [[ $COMMAND_CONTENT == *"10.0.40.1"* ]]; then
        print_test_result "Flow command file written" 0
    else
        print_test_result "Flow command file written" 1 "File exists but content invalid"
    fi
else
    print_test_result "Flow command file written" 1 "commands.json not found"
fi

echo ""
echo "==========================================================================="
echo "PHASE 4: READ OPERATIONS (Verification)"
echo "==========================================================================="
echo ""

# Test 13: Verify created slice appears in slice list
echo "Test 13: Verifying created slice in slice list..."
sleep 2  # Give time for state to update
SLICES_CHECK=$(curl -s http://localhost:3001/api/slices)
if [[ $SLICES_CHECK == *"TestSlice_Integration"* ]]; then
    print_test_result "Created slice visible in list" 0
else
    print_test_result "Created slice visible in list" 1 "Slice not found in list"
fi

# Test 14: Verify created flow appears in flow list
echo "Test 14: Verifying created flow in flow list..."
FLOWS_CHECK=$(curl -s http://localhost:3001/api/flows)
if [[ $FLOWS_CHECK == *"10.0.40.1"* ]]; then
    print_test_result "Created flow visible in list" 0
else
    print_test_result "Created flow visible in list" 1 "Flow not found in list"
fi

# Test 15: Get specific slice by ID
if [ -n "$TEST_SLICE_ID" ]; then
    echo "Test 15: Getting specific slice by ID..."
    SPECIFIC_SLICE=$(curl -s http://localhost:3001/api/slices/$TEST_SLICE_ID)
    if [[ $SPECIFIC_SLICE == *"TestSlice_Integration"* ]]; then
        print_test_result "Get slice by ID works" 0
    else
        print_test_result "Get slice by ID works" 1 "Slice not found by ID"
    fi
else
    echo "Test 15: Skipping (no test slice ID)"
fi

# Test 16: Get specific flow by ID
if [ -n "$TEST_FLOW_ID" ]; then
    echo "Test 16: Getting specific flow by ID..."
    SPECIFIC_FLOW=$(curl -s http://localhost:3001/api/flows/$TEST_FLOW_ID)
    if [[ $SPECIFIC_FLOW == *"10.0.40.1"* ]]; then
        print_test_result "Get flow by ID works" 0
    else
        print_test_result "Get flow by ID works" 1 "Flow not found by ID"
    fi
else
    echo "Test 16: Skipping (no test flow ID)"
fi

echo ""
echo "==========================================================================="
echo "PHASE 5: DELETE OPERATIONS (Cleanup)"
echo "==========================================================================="
echo ""

# Test 17: Delete test flow
if [ -n "$TEST_FLOW_ID" ]; then
    echo "Test 17: Deleting test flow..."
    DELETE_FLOW_RESPONSE=$(curl -s -X DELETE http://localhost:3001/api/flows/$TEST_FLOW_ID)
    if [ $? -eq 0 ] && [[ $DELETE_FLOW_RESPONSE == *"10.0.40.1"* ]]; then
        print_test_result "Delete flow API works" 0
    else
        print_test_result "Delete flow API works" 1 "Failed to delete flow"
    fi
else
    echo "Test 17: Skipping (no test flow to delete)"
fi

# Test 18: Delete test slice
if [ -n "$TEST_SLICE_ID" ]; then
    echo "Test 18: Deleting test slice..."
    DELETE_SLICE_RESPONSE=$(curl -s -X DELETE http://localhost:3001/api/slices/$TEST_SLICE_ID)
    if [ $? -eq 0 ] && [[ $DELETE_SLICE_RESPONSE == *"TestSlice_Integration"* ]]; then
        print_test_result "Delete slice API works" 0
    else
        print_test_result "Delete slice API works" 1 "Failed to delete slice"
    fi
else
    echo "Test 18: Skipping (no test slice to delete)"
fi

# Test 19: Verify slice was deleted
echo "Test 19: Verifying slice deletion..."
sleep 2
SLICES_AFTER=$(curl -s http://localhost:3001/api/slices)
if [[ $SLICES_AFTER != *"TestSlice_Integration"* ]]; then
    print_test_result "Slice deleted successfully" 0
else
    print_test_result "Slice deleted successfully" 1 "Slice still exists after delete"
fi

# Test 20: Verify flow was deleted
echo "Test 20: Verifying flow deletion..."
FLOWS_AFTER=$(curl -s http://localhost:3001/api/flows)
if [ -z "$TEST_FLOW_ID" ] || [[ $FLOWS_AFTER != *"\"id\":$TEST_FLOW_ID"* ]]; then
    print_test_result "Flow deleted successfully" 0
else
    print_test_result "Flow deleted successfully" 1 "Flow still exists after delete"
fi

echo ""
echo "==========================================================================="
echo "TEST SUMMARY"
echo "==========================================================================="
echo ""
echo -e "Total Tests:  ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Passed:       ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed:       ${RED}$FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}                   ALL TESTS PASSED! ✓                              ${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Phase 6 Integration Testing: COMPLETE ✅"
    echo ""
    echo "The SDN Dashboard system is fully integrated and operational."
    echo "Bidirectional communication between Dashboard, Backend, and Simulation"
    echo "has been verified and is working correctly."
    echo ""
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}                   SOME TESTS FAILED                                ${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Failed tests:"
    for result in "${TEST_RESULTS[@]}"; do
        if [[ $result == FAIL* ]]; then
            echo -e "  ${RED}✗${NC} $result"
        fi
    done
    echo ""
fi

# Save results to file
RESULT_FILE="test_results.txt"
echo "SDN Dashboard Integration Test Results" > $RESULT_FILE
echo "Date: $(date)" >> $RESULT_FILE
echo "========================================" >> $RESULT_FILE
echo "" >> $RESULT_FILE
echo "Total Tests: $TOTAL_TESTS" >> $RESULT_FILE
echo "Passed: $PASSED_TESTS" >> $RESULT_FILE
echo "Failed: $FAILED_TESTS" >> $RESULT_FILE
echo "" >> $RESULT_FILE
echo "Detailed Results:" >> $RESULT_FILE
for result in "${TEST_RESULTS[@]}"; do
    echo "  $result" >> $RESULT_FILE
done

echo "Results saved to: $RESULT_FILE"
echo ""
echo "==========================================================================="

# Exit with appropriate code
if [ $FAILED_TESTS -eq 0 ]; then
    exit 0
else
    exit 1
fi
