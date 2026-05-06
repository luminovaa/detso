#!/bin/bash
# ==========================================
# Mikrotik PPPoE Setup via REST API
# RouterOS 7.x REST API (port 80)
# ==========================================

echo "🚀 Mikrotik PPPoE Setup via REST API"
echo ""

configure_router() {
  local NAME=$1
  local PORT=$2
  local POOL_RANGE=$3
  local LOCAL_IP=$4
  local IDENTITY=$5

  echo "============================================================"
  echo "🔧 Configuring ${NAME} (REST API port ${PORT})"
  echo "============================================================"
  
  BASE="http://localhost:${PORT}/rest"
  AUTH="-u admin:"
  CT="-H Content-Type:application/json"

  # 1. Set Identity
  echo "📝 Setting identity..."
  curl -s ${AUTH} ${CT} -X POST "${BASE}/system/identity/set" \
    -d "{\"name\":\"${IDENTITY}\"}" > /dev/null 2>&1
  echo "   ✅ Identity: ${IDENTITY}"

  # 2. Add IP Address on ether2
  echo "🌐 Adding IP address on ether2..."
  # First check if already exists
  EXISTING=$(curl -s ${AUTH} "${BASE}/ip/address?interface=ether2" 2>/dev/null)
  if echo "$EXISTING" | grep -q "address"; then
    echo "   ℹ️  IP already exists on ether2, skipping"
  else
    curl -s ${AUTH} ${CT} -X PUT "${BASE}/ip/address" \
      -d "{\"address\":\"${LOCAL_IP}/24\",\"interface\":\"ether2\"}" > /dev/null 2>&1
    echo "   ✅ IP ${LOCAL_IP}/24 on ether2"
  fi

  # 3. Create IP Pool
  echo "🏊 Creating IP Pool..."
  EXISTING=$(curl -s ${AUTH} "${BASE}/ip/pool?name=pppoe-pool" 2>/dev/null)
  if echo "$EXISTING" | grep -q "pppoe-pool"; then
    echo "   ℹ️  Pool already exists, skipping"
  else
    curl -s ${AUTH} ${CT} -X PUT "${BASE}/ip/pool" \
      -d "{\"name\":\"pppoe-pool\",\"ranges\":\"${POOL_RANGE}\"}" > /dev/null 2>&1
    echo "   ✅ Pool: pppoe-pool (${POOL_RANGE})"
  fi

  # 4. Create PPP Profile
  echo "👤 Creating PPP Profile..."
  EXISTING=$(curl -s ${AUTH} "${BASE}/ppp/profile?name=pppoe-profile" 2>/dev/null)
  if echo "$EXISTING" | grep -q "pppoe-profile"; then
    echo "   ℹ️  Profile already exists, skipping"
  else
    curl -s ${AUTH} ${CT} -X PUT "${BASE}/ppp/profile" \
      -d "{\"name\":\"pppoe-profile\",\"local-address\":\"${LOCAL_IP}\",\"remote-address\":\"pppoe-pool\",\"dns-server\":\"8.8.8.8,8.8.4.4\",\"rate-limit\":\"10M/10M\"}" > /dev/null 2>&1
    echo "   ✅ Profile: pppoe-profile (rate: 10M/10M)"
  fi

  # 5. Create PPPoE Server
  echo "📡 Creating PPPoE Server..."
  EXISTING=$(curl -s ${AUTH} "${BASE}/interface/pppoe-server/server?service-name=detso-pppoe" 2>/dev/null)
  if echo "$EXISTING" | grep -q "detso-pppoe"; then
    echo "   ℹ️  PPPoE Server already exists, skipping"
  else
    curl -s ${AUTH} ${CT} -X PUT "${BASE}/interface/pppoe-server/server" \
      -d "{\"service-name\":\"detso-pppoe\",\"interface\":\"ether2\",\"default-profile\":\"pppoe-profile\",\"authentication\":\"pap,chap,mschap1,mschap2\",\"disabled\":\"false\"}" > /dev/null 2>&1
    echo "   ✅ PPPoE Server: detso-pppoe on ether2"
  fi

  # 6. Configure RADIUS (disabled - waiting for FreeRADIUS)
  echo "🔐 Configuring RADIUS client..."
  EXISTING=$(curl -s ${AUTH} "${BASE}/radius" 2>/dev/null)
  if echo "$EXISTING" | grep -q "172.17.0.1"; then
    echo "   ℹ️  RADIUS already configured, skipping"
  else
    curl -s ${AUTH} ${CT} -X PUT "${BASE}/radius" \
      -d "{\"address\":\"172.17.0.1\",\"secret\":\"detso-radius-secret\",\"service\":\"ppp\",\"authentication-port\":\"1812\",\"accounting-port\":\"1813\",\"timeout\":\"3s\",\"disabled\":\"true\"}" > /dev/null 2>&1
    echo "   ✅ RADIUS: 172.17.0.1:1812 (DISABLED)"
  fi

  # 7. Configure PPP AAA
  echo "⚙️  Configuring PPP AAA..."
  curl -s ${AUTH} ${CT} -X POST "${BASE}/ppp/aaa/set" \
    -d "{\"use-radius\":\"yes\",\"accounting\":\"yes\",\"interim-update\":\"5m\"}" > /dev/null 2>&1
  echo "   ✅ PPP AAA: use-radius=yes, accounting=yes"

  # 8. Create test user
  echo "🧪 Creating test PPPoE user..."
  EXISTING=$(curl -s ${AUTH} "${BASE}/ppp/secret?name=test-user" 2>/dev/null)
  if echo "$EXISTING" | grep -q "test-user"; then
    echo "   ℹ️  Test user already exists, skipping"
  else
    curl -s ${AUTH} ${CT} -X PUT "${BASE}/ppp/secret" \
      -d "{\"name\":\"test-user\",\"password\":\"test123\",\"profile\":\"pppoe-profile\",\"service\":\"pppoe\"}" > /dev/null 2>&1
    echo "   ✅ Test user: test-user / test123"
  fi

  # 9. Verify
  echo ""
  echo "📋 Verification:"
  
  echo -n "   Identity: "
  curl -s ${AUTH} "${BASE}/system/identity" 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin).get('name','?'))" 2>/dev/null || echo "?"
  
  echo -n "   IP Pool: "
  curl -s ${AUTH} "${BASE}/ip/pool" 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); [print(f\"{x['name']}: {x['ranges']}\") for x in d]" 2>/dev/null || echo "?"
  
  echo -n "   PPPoE Server: "
  curl -s ${AUTH} "${BASE}/interface/pppoe-server/server" 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); [print(f\"{x['service-name']} on {x['interface']}\") for x in d]" 2>/dev/null || echo "?"
  
  echo -n "   RADIUS: "
  curl -s ${AUTH} "${BASE}/radius" 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); [print(f\"{x['address']}:{x.get('authentication-port','?')} disabled={x.get('disabled','?')}\") for x in d]" 2>/dev/null || echo "?"
  
  echo -n "   PPP Secrets: "
  curl -s ${AUTH} "${BASE}/ppp/secret" 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); [print(f\"{x['name']}\") for x in d]" 2>/dev/null || echo "?"

  echo ""
  echo "✅ ${NAME} configured!"
  echo ""
}

# Configure Router Pusat
configure_router "Router Pusat" "8082" "10.10.10.2-10.10.10.254" "10.10.10.1" "Router-Pusat"

# Configure Router Cabang
configure_router "Router Cabang" "8083" "10.10.20.2-10.10.20.254" "10.10.20.1" "Router-Cabang"

echo "============================================================"
echo "🎉 ALL ROUTERS CONFIGURED!"
echo "============================================================"
echo ""
echo "📝 Summary:"
echo "   Router Pusat (port 8082/8728):"
echo "     - PPPoE: detso-pppoe on ether2"
echo "     - Pool: 10.10.10.2-10.10.10.254"
echo "     - RADIUS: 172.17.0.1:1812 (DISABLED)"
echo ""
echo "   Router Cabang (port 8083/8730):"
echo "     - PPPoE: detso-pppoe on ether2"
echo "     - Pool: 10.10.20.2-10.10.20.254"
echo "     - RADIUS: 172.17.0.1:1812 (DISABLED)"
echo ""
echo "📝 Test Credentials: test-user / test123"
echo ""
echo "📝 When FreeRADIUS is ready:"
echo "   curl -u admin: -X POST http://localhost:8082/rest/radius/set \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"numbers\":\"0\",\"disabled\":\"false\"}'"
echo ""
