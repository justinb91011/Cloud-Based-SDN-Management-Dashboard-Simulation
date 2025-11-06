#!/bin/bash

echo "============================================================"
echo "Phase 5 Frontend Validation Test"
echo "============================================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

PASSED=0
FAILED=0

# Test 1: Check if frontend is running
echo "Test 1: Frontend server running on port 3000..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
    echo -e "${GREEN}✓ Frontend is running${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Frontend is not running${NC}"
    ((FAILED++))
fi

# Test 2: Check if HTML contains correct title
echo "Test 2: Frontend HTML title..."
if curl -s http://localhost:3000 | grep -q "SDN Management Dashboard"; then
    echo -e "${GREEN}✓ Correct HTML title${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Incorrect HTML title${NC}"
    ((FAILED++))
fi

# Test 3: Check if backend API is accessible from frontend perspective
echo "Test 3: Backend API accessible..."
if curl -s http://localhost:3001/api/health | grep -q "healthy"; then
    echo -e "${GREEN}✓ Backend API is accessible${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Backend API not accessible${NC}"
    ((FAILED++))
fi

# Test 4: Check if slices endpoint returns data
echo "Test 4: Slices data available..."
if curl -s http://localhost:3001/api/slices | grep -q "Tenant_A"; then
    echo -e "${GREEN}✓ Slices data available${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Slices data not available${NC}"
    ((FAILED++))
fi

# Test 5: Check if flows endpoint returns data
echo "Test 5: Flows data available..."
FLOW_COUNT=$(curl -s http://localhost:3001/api/flows | grep -o '"id"' | wc -l)
if [ "$FLOW_COUNT" -ge 10 ]; then
    echo -e "${GREEN}✓ Flows data available ($FLOW_COUNT flows)${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Insufficient flows data${NC}"
    ((FAILED++))
fi

# Test 6: Check if topology endpoint returns data
echo "Test 6: Topology data available..."
NODE_COUNT=$(curl -s http://localhost:3001/api/topology | grep -o '"id"' | wc -l)
if [ "$NODE_COUNT" -ge 20 ]; then
    echo -e "${GREEN}✓ Topology data available ($NODE_COUNT nodes)${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Insufficient topology data${NC}"
    ((FAILED++))
fi

# Test 7: Check if statistics endpoint works
echo "Test 7: Statistics endpoint..."
if curl -s http://localhost:3001/api/statistics | grep -q "totalSlices"; then
    echo -e "${GREEN}✓ Statistics endpoint working${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Statistics endpoint not working${NC}"
    ((FAILED++))
fi

# Test 8: Check if all required files exist
echo "Test 8: Frontend source files exist..."
FILES=(
    "src/App.js"
    "src/App.css"
    "src/index.js"
    "src/components/TopologyView.js"
    "src/components/SlicePanel.js"
    "src/components/FlowPanel.js"
    "src/components/Statistics.js"
    "src/services/api.js"
)

ALL_FILES_EXIST=true
for file in "${FILES[@]}"; do
    if [ ! -f "$file" ]; then
        ALL_FILES_EXIST=false
        echo "  Missing: $file"
    fi
done

if [ "$ALL_FILES_EXIST" = true ]; then
    echo -e "${GREEN}✓ All source files exist${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Some source files missing${NC}"
    ((FAILED++))
fi

# Test 9: Check if package.json has correct scripts
echo "Test 9: Package.json scripts..."
if grep -q '"start": "react-scripts start"' package.json; then
    echo -e "${GREEN}✓ Package.json has correct scripts${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Package.json missing scripts${NC}"
    ((FAILED++))
fi

# Test 10: Check if node_modules exist
echo "Test 10: Dependencies installed..."
if [ -d "node_modules" ] && [ -d "node_modules/react" ]; then
    echo -e "${GREEN}✓ Dependencies installed${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Dependencies not installed${NC}"
    ((FAILED++))
fi

echo ""
echo "============================================================"
echo "Test Results"
echo "============================================================"
echo "Passed: $PASSED"
echo "Failed: $FAILED"
echo "Total: $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed! Phase 5 is complete. ✓${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed. Please review.${NC}"
    exit 1
fi
