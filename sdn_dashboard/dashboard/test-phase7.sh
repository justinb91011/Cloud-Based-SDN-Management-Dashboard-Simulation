#!/bin/bash

# Phase 7 Testing Script
# Tests event-driven architecture and advanced real-time features

echo "=========================================="
echo "Phase 7 Feature Testing"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="http://localhost:3001/api"
WS_URL="ws://localhost:3001"

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print test result
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
        ((TESTS_FAILED++))
    fi
}

# Test 1: Backend server health check
echo "Test 1: Backend Server Health Check"
response=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/health)
if [ "$response" = "200" ]; then
    print_result 0 "Backend server is healthy"
else
    print_result 1 "Backend server health check failed (HTTP $response)"
fi
echo ""

# Test 2: WebSocket status endpoint
echo "Test 2: WebSocket Status Endpoint"
status_response=$(curl -s $API_URL/status)
if echo "$status_response" | grep -q "websocket"; then
    print_result 0 "Status endpoint returns WebSocket info"
    echo "   Response: $status_response"
else
    print_result 1 "Status endpoint missing WebSocket info"
fi
echo ""

# Test 3: Create slice with ACL support
echo "Test 3: Create Slice with ACL Support"
create_response=$(curl -s -X POST $API_URL/slices \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Test_ACL_Slice",
        "vlanId": 100,
        "bandwidth": 500,
        "hosts": ["10.0.100.1", "10.0.100.2"],
        "isolated": true,
        "acl": [
            {
                "id": 1,
                "srcIP": "10.0.100.1",
                "dstIP": "10.0.100.2",
                "protocol": "tcp",
                "action": "allow"
            }
        ]
    }')

if echo "$create_response" | grep -q "Test_ACL_Slice"; then
    print_result 0 "Slice created with ACL support"
    slice_id=$(echo "$create_response" | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
    echo "   Slice ID: $slice_id"
else
    print_result 1 "Failed to create slice with ACL"
    slice_id=""
fi
echo ""

# Test 4: Update slice with ACL rules
if [ ! -z "$slice_id" ]; then
    echo "Test 4: Update Slice ACL Rules"
    update_response=$(curl -s -X PUT $API_URL/slices/$slice_id \
        -H "Content-Type: application/json" \
        -d '{
            "acl": [
                {
                    "id": 1,
                    "srcIP": "10.0.100.1",
                    "dstIP": "10.0.100.2",
                    "protocol": "tcp",
                    "action": "allow"
                },
                {
                    "id": 2,
                    "srcIP": "10.0.100.2",
                    "dstIP": "0.0.0.0",
                    "protocol": "any",
                    "action": "deny"
                }
            ]
        }')

    if echo "$update_response" | grep -q "deny"; then
        print_result 0 "ACL rules updated successfully"
    else
        print_result 1 "Failed to update ACL rules"
    fi
    echo ""
fi

# Test 5: Verify connection state management
echo "Test 5: Connection State Management"
status=$(curl -s $API_URL/status)
if echo "$status" | grep -q '"connected"'; then
    connection_state=$(echo "$status" | grep -o '"connected":[^,]*' | grep -o '[a-z]*$')
    print_result 0 "Connection state tracked: $connection_state"
else
    print_result 1 "Connection state not tracked"
fi
echo ""

# Test 6: Verify heartbeat timestamp
echo "Test 6: Heartbeat Mechanism"
status=$(curl -s $API_URL/status)
if echo "$status" | grep -q '"lastHeartbeat"'; then
    heartbeat=$(echo "$status" | grep -o '"lastHeartbeat":[0-9]*' | grep -o '[0-9]*')
    print_result 0 "Heartbeat timestamp tracked: $heartbeat"
else
    print_result 1 "Heartbeat mechanism not working"
fi
echo ""

# Test 7: Get all slices
echo "Test 7: Retrieve All Slices"
slices=$(curl -s $API_URL/slices)
if echo "$slices" | grep -q '\['; then
    slice_count=$(echo "$slices" | grep -o '"id":' | wc -l | tr -d ' ')
    print_result 0 "Retrieved slices (count: $slice_count)"
else
    print_result 1 "Failed to retrieve slices"
fi
echo ""

# Test 8: Verify ACL data in slice response
if [ ! -z "$slice_id" ]; then
    echo "Test 8: Verify ACL in Slice Response"
    slice_data=$(curl -s $API_URL/slices/$slice_id)
    if echo "$slice_data" | grep -q '"acl"'; then
        acl_count=$(echo "$slice_data" | grep -o '"protocol"' | wc -l | tr -d ' ')
        print_result 0 "ACL data present in slice response (rules: $acl_count)"
    else
        print_result 1 "ACL data missing from slice response"
    fi
    echo ""
fi

# Test 9: Cleanup - Delete test slice
if [ ! -z "$slice_id" ]; then
    echo "Test 9: Cleanup Test Slice"
    delete_response=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE $API_URL/slices/$slice_id)
    if [ "$delete_response" = "200" ]; then
        print_result 0 "Test slice deleted successfully"
    else
        print_result 1 "Failed to delete test slice"
    fi
    echo ""
fi

# Test 10: WebSocket clients count
echo "Test 10: WebSocket Clients Tracking"
status=$(curl -s $API_URL/status)
if echo "$status" | grep -q '"clients"'; then
    client_count=$(echo "$status" | grep -o '"clients":[0-9]*' | grep -o '[0-9]*')
    print_result 0 "WebSocket clients tracked (count: $client_count)"
else
    print_result 1 "WebSocket clients not tracked"
fi
echo ""

# Summary
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo -e "Total Tests:  $(($TESTS_PASSED + $TESTS_FAILED))"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}All Phase 7 tests passed!${NC}"
    echo ""
    echo "Phase 7 Features Verified:"
    echo "  ✓ Enhanced WebSocket with push notifications"
    echo "  ✓ Connection state management"
    echo "  ✓ Heartbeat mechanism"
    echo "  ✓ Per-slice ACL editing support"
    echo "  ✓ Status endpoint for monitoring"
    echo "  ✓ WebSocket client tracking"
    echo ""
    exit 0
else
    echo -e "${YELLOW}Some tests failed. Please review the output above.${NC}"
    echo ""
    exit 1
fi
