#!/bin/bash

# Phase 8 Testing Script
# Comprehensive testing for performance metrics and advanced features

echo "==================================================================="
echo "Phase 8 Testing - Performance Metrics & Advanced Features"
echo "==================================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="http://localhost:3001/api"

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to check if backend is running
check_backend() {
    echo -n "Checking if backend is running... "
    if curl -s "$BASE_URL/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Backend is running"
        return 0
    else
        echo -e "${RED}✗${NC} Backend is not running"
        echo ""
        echo "Please start the backend server:"
        echo "  cd dashboard/backend"
        echo "  node server.js"
        echo ""
        return 1
    fi
}

# Helper function to check if frontend is accessible
check_frontend() {
    echo -n "Checking if frontend is running... "
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Frontend is running"
        return 0
    else
        echo -e "${YELLOW}⚠${NC} Frontend might not be running"
        echo "  To start: cd dashboard/frontend && npm start"
        return 1
    fi
}

# Helper function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_pattern="$3"

    echo ""
    echo "-------------------------------------------------------------------"
    echo "Test: $test_name"
    echo "-------------------------------------------------------------------"

    result=$(eval "$test_command" 2>&1)
    exit_code=$?

    if [ $exit_code -eq 0 ]; then
        if [ -z "$expected_pattern" ] || echo "$result" | grep -q "$expected_pattern"; then
            echo -e "${GREEN}✓ PASSED${NC}"
            ((TESTS_PASSED++))
            return 0
        else
            echo -e "${RED}✗ FAILED${NC} - Expected pattern not found: $expected_pattern"
            echo "Result: $result"
            ((TESTS_FAILED++))
            return 1
        fi
    else
        echo -e "${RED}✗ FAILED${NC} - Command failed with exit code $exit_code"
        echo "Output: $result"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Main testing flow
main() {
    echo ""
    echo "Phase 8: Performance Metrics & Advanced Multi-Tenant Testing"
    echo ""

    # Check prerequisites
    if ! check_backend; then
        exit 1
    fi

    check_frontend

    echo ""
    echo "==================================================================="
    echo "Starting Tests..."
    echo "==================================================================="

    # Test 1: Health Check
    run_test "Backend Health Check" \
        "curl -s $BASE_URL/health" \
        "healthy"

    # Test 2: Metrics Endpoint Availability
    run_test "Metrics Endpoint Available" \
        "curl -s $BASE_URL/metrics" \
        "avgApiResponseTime"

    # Test 3: Recent Metrics Endpoint
    run_test "Recent Metrics Endpoint" \
        "curl -s '$BASE_URL/metrics/recent?count=10'" \
        "apiResponseTimes"

    # Test 4: Create Slice and Check Metrics
    run_test "Create Slice with Performance Tracking" \
        "curl -s -X POST $BASE_URL/slices -H 'Content-Type: application/json' -d '{\"name\":\"TestSlice1\",\"vlanId\":100,\"bandwidth\":1000,\"hosts\":[\"10.0.1.1\",\"10.0.1.2\"],\"isolated\":true}'" \
        '"id"'

    # Test 5: Verify Slice Operation was Recorded
    run_test "Verify Slice Operation in Metrics" \
        "curl -s $BASE_URL/metrics" \
        "sliceOperations"

    # Test 6: Create Flow and Check Metrics
    run_test "Create Flow with Performance Tracking" \
        "curl -s -X POST $BASE_URL/flows -H 'Content-Type: application/json' -d '{\"srcIP\":\"10.0.1.1\",\"dstIP\":\"10.0.1.2\",\"action\":\"ALLOW\",\"priority\":100,\"sliceId\":1}'" \
        '"id"'

    # Test 7: Verify Flow Operation was Recorded
    run_test "Verify Flow Operation in Metrics" \
        "curl -s $BASE_URL/metrics" \
        "flowOperations"

    # Test 8: System Load Metrics
    run_test "System Load Metrics Available" \
        "curl -s $BASE_URL/metrics" \
        "memoryUsage"

    # Test 9: WebSocket Status
    run_test "WebSocket Status Check" \
        "curl -s $BASE_URL/status" \
        "websocket"

    # Test 10: Topology with Metrics
    run_test "Topology Endpoint Response" \
        "curl -s $BASE_URL/topology" \
        "nodes"

    echo ""
    echo "==================================================================="
    echo "Advanced Scenario Testing"
    echo "==================================================================="
    echo ""

    # Run advanced scenarios if available
    if [ -f "./test-advanced-scenarios.sh" ]; then
        echo "Running advanced scenarios..."
        echo ""
        bash ./test-advanced-scenarios.sh
    else
        echo -e "${YELLOW}⚠${NC} Advanced scenarios script not found"
    fi

    echo ""
    echo "==================================================================="
    echo "Test Results Summary"
    echo "==================================================================="
    echo ""

    TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))

    echo "Total Tests: $TOTAL_TESTS"
    echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
    echo -e "${RED}Failed: $TESTS_FAILED${NC}"

    if [ $TESTS_FAILED -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✓ All tests passed!${NC}"
        echo ""
    else
        echo ""
        echo -e "${RED}✗ Some tests failed${NC}"
        echo ""
    fi

    echo "==================================================================="
    echo "Metrics Report"
    echo "==================================================================="
    echo ""

    # Fetch and display current metrics
    echo "Current Performance Metrics:"
    curl -s "$BASE_URL/metrics" | python3 -m json.tool 2>/dev/null || curl -s "$BASE_URL/metrics"

    echo ""
    echo ""
    echo "==================================================================="
    echo "Next Steps"
    echo "==================================================================="
    echo ""
    echo "1. Open the dashboard in your browser: http://localhost:3000"
    echo "2. Check the Performance Metrics section at the bottom"
    echo "3. Create/delete slices and flows to see real-time metrics updates"
    echo "4. Click on metric cards to see detailed operation history"
    echo "5. Enable/disable auto-refresh to control metric updates"
    echo ""
    echo "To compile test logs:"
    echo "  python3 compile-test-logs.py"
    echo ""
    echo "To run advanced stress testing:"
    echo "  ./test-advanced-scenarios.sh"
    echo ""

    # Return appropriate exit code
    if [ $TESTS_FAILED -eq 0 ]; then
        return 0
    else
        return 1
    fi
}

# Run main function
main
exit $?
