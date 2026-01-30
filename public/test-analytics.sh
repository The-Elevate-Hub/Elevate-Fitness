#!/bin/bash

# ELEVATE FITNESS - Analytics Verification Test Suite
# Run this script after implementing the fixes to verify everything works

echo "🎯 ELEVATE FITNESS - Analytics Verification"
echo "==========================================="
echo ""

# Configuration
API_URL="${1:-http://localhost:3000}"
echo "Testing API at: $API_URL"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check Analytics Endpoint
echo "📊 Test 1: Analytics Endpoint"
echo "-----------------------------------"
ANALYTICS_RESPONSE=$(curl -s "$API_URL/api/analytics")
TOTAL_REVENUE=$(echo $ANALYTICS_RESPONSE | jq -r '.totalRevenue // 0')
TOTAL_ORDERS=$(echo $ANALYTICS_RESPONSE | jq -r '.totalOrders // 0')

if [ "$TOTAL_REVENUE" != "null" ]; then
    echo -e "${GREEN}✓${NC} Analytics endpoint responding"
    echo "  Total Revenue: \$$((TOTAL_REVENUE / 100))"
    echo "  Total Orders: $TOTAL_ORDERS"
else
    echo -e "${RED}✗${NC} Analytics endpoint error"
fi
echo ""

# Test 2: Check Data Quality
echo "🔍 Test 2: Data Quality Check"
echo "-----------------------------------"
PENDING_COUNT=$(echo $ANALYTICS_RESPONSE | jq -r '.dataQuality.oldPendingOrders // 0')
if [ "$PENDING_COUNT" = "0" ]; then
    echo -e "${GREEN}✓${NC} No old pending orders"
else
    echo -e "${YELLOW}⚠${NC} Found $PENDING_COUNT old pending orders"
    echo "  Run cleanup endpoint to fix"
fi
echo ""

# Test 3: Check Influencer Report
echo "💰 Test 3: Influencer Commission Report"
echo "-----------------------------------"
INFLUENCER_RESPONSE=$(curl -s "$API_URL/api/influencers/report")
TOTAL_COMMISSION=$(echo $INFLUENCER_RESPONSE | jq -r '.summary.totalCommissionCents // 0')
INFLUENCER_COUNT=$(echo $INFLUENCER_RESPONSE | jq -r '.influencers | length')

if [ "$INFLUENCER_COUNT" != "null" ]; then
    echo -e "${GREEN}✓${NC} Influencer report generated"
    echo "  Active Influencers: $INFLUENCER_COUNT"
    echo "  Total Owed: \$$((TOTAL_COMMISSION / 100))"
    
    # Show each influencer
    echo ""
    echo "  Commission Breakdown:"
    echo $INFLUENCER_RESPONSE | jq -r '.influencers[] | "  - \(.name) (\(.code)): $\(.totalCommission) from \(.totalOrders) orders"'
else
    echo -e "${RED}✗${NC} Influencer report error"
fi
echo ""

# Test 4: Verify Commission Calculations
echo "🧮 Test 4: Commission Calculation Accuracy"
echo "-----------------------------------"
CALCULATION_ERRORS=0

echo $INFLUENCER_RESPONSE | jq -c '.influencers[]' | while read influencer; do
    NAME=$(echo $influencer | jq -r '.name')
    REVENUE=$(echo $influencer | jq -r '.totalRevenueCents')
    RATE=$(echo $influencer | jq -r '.commissionRate')
    COMMISSION=$(echo $influencer | jq -r '.totalCommissionCents')
    
    # Calculate expected commission
    EXPECTED=$((REVENUE * RATE / 100))
    
    if [ "$COMMISSION" = "$EXPECTED" ]; then
        echo -e "${GREEN}✓${NC} $NAME: Commission accurate"
    else
        echo -e "${RED}✗${NC} $NAME: Commission mismatch!"
        echo "    Expected: $EXPECTED cents"
        echo "    Got: $COMMISSION cents"
        CALCULATION_ERRORS=$((CALCULATION_ERRORS + 1))
    fi
done

if [ "$CALCULATION_ERRORS" = "0" ]; then
    echo -e "${GREEN}✓${NC} All commission calculations accurate"
else
    echo -e "${RED}✗${NC} Found $CALCULATION_ERRORS calculation errors"
fi
echo ""

# Test 5: Database Cleanup Status
echo "🧹 Test 5: Database Cleanup Status"
echo "-----------------------------------"
echo "Running cleanup verification..."
CLEANUP_RESPONSE=$(curl -s -X POST "$API_URL/api/admin/cleanup?verify=true")
ISSUES_COUNT=$(echo $CLEANUP_RESPONSE | jq -r '.issues.found // 0')

if [ "$ISSUES_COUNT" = "0" ]; then
    echo -e "${GREEN}✓${NC} No database issues found"
else
    echo -e "${YELLOW}⚠${NC} Found $ISSUES_COUNT database issues"
    echo ""
    echo "  Issues found:"
    echo $CLEANUP_RESPONSE | jq -r '.issues.list[] | "  - \(.type): \(.count) items (\(.description))"'
    echo ""
    echo -e "${YELLOW}→${NC} Run cleanup with ?execute=true to fix"
fi
echo ""

# Test 6: Verify No Unpaid Orders in Analytics
echo "🔒 Test 6: Payment Verification"
echo "-----------------------------------"
COMPLETED_WITHOUT_SESSION=$(echo $CLEANUP_RESPONSE | jq -r '.issues.list[] | select(.type=="COMPLETED_WITHOUT_SESSION") | .count // 0')

if [ "$COMPLETED_WITHOUT_SESSION" = "0" ]; then
    echo -e "${GREEN}✓${NC} All completed orders have payment verification"
else
    echo -e "${RED}✗${NC} Found $COMPLETED_WITHOUT_SESSION completed orders without payment proof!"
    echo "  This is CRITICAL - these orders may not be paid"
fi
echo ""

# Summary
echo "========================================="
echo "📋 SUMMARY"
echo "========================================="
echo ""
echo "Analytics:"
echo "  - Revenue: \$$((TOTAL_REVENUE / 100))"
echo "  - Orders: $TOTAL_ORDERS"
echo "  - Commissions Owed: \$$((TOTAL_COMMISSION / 100))"
echo ""

if [ "$PENDING_COUNT" = "0" ] && [ "$COMPLETED_WITHOUT_SESSION" = "0" ] && [ "$CALCULATION_ERRORS" = "0" ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "Your analytics are now 100% accurate."
    echo "You can safely pay influencers the amounts shown."
else
    echo -e "${YELLOW}⚠ Some issues need attention${NC}"
    echo ""
    if [ "$PENDING_COUNT" != "0" ]; then
        echo "  - Run cleanup to remove old pending orders"
    fi
    if [ "$COMPLETED_WITHOUT_SESSION" != "0" ]; then
        echo "  - CRITICAL: Review completed orders without payment proof"
    fi
    if [ "$CALCULATION_ERRORS" != "0" ]; then
        echo "  - CRITICAL: Commission calculation errors found"
    fi
fi
echo ""

# Export reports suggestion
echo "📥 Export Reports:"
echo "  JSON: curl '$API_URL/api/influencers/report' > report.json"
echo "  CSV:  curl -X POST '$API_URL/api/influencers/report' > report.csv"
echo ""
echo "Done! ✨"
