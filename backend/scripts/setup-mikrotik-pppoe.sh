#!/bin/bash
# ==========================================
# Mikrotik PPPoE Setup Script
# Configures both routers for FreeRADIUS integration
# ==========================================

echo "🚀 Mikrotik PPPoE Setup Script"
echo "   Preparing routers for FreeRADIUS integration"
echo ""

# ==========================================
# ROUTER PUSAT (port 2222)
# ==========================================
echo "============================================================"
echo "🔧 Configuring Router Pusat (SSH port 2222)"
echo "============================================================"

# Use docker exec to run commands inside the container
# The container runs QEMU with Mikrotik, so we use the internal telnet
docker exec routeros_pusat bash -c '
cat << "MIKROTIK_COMMANDS" | timeout 30 telnet localhost 23 2>/dev/null
admin

/system identity set name=Router-Pusat
/ip address add address=10.10.10.1/24 interface=ether2
/ip pool add name=pppoe-pool ranges=10.10.10.2-10.10.10.254
/ppp profile add name=pppoe-profile local-address=10.10.10.1 remote-address=pppoe-pool dns-server=8.8.8.8,8.8.4.4 rate-limit=10M/10M
/interface pppoe-server server add service-name=detso-pppoe interface=ether2 default-profile=pppoe-profile authentication=pap,chap,mschap1,mschap2 disabled=no
/radius add address=172.17.0.1 secret=detso-radius-secret service=ppp authentication-port=1812 accounting-port=1813 timeout=3000ms disabled=yes
/ppp aaa set use-radius=yes accounting=yes interim-update=5m
/ppp secret add name=test-user password=test123 profile=pppoe-profile service=pppoe
/quit
MIKROTIK_COMMANDS
' 2>&1 | tail -5

echo "✅ Router Pusat commands sent"
echo ""

# ==========================================
# ROUTER CABANG (port 2224)
# ==========================================
echo "============================================================"
echo "🔧 Configuring Router Cabang (SSH port 2224)"
echo "============================================================"

docker exec routeros_cabang bash -c '
cat << "MIKROTIK_COMMANDS" | timeout 30 telnet localhost 23 2>/dev/null
admin

/system identity set name=Router-Cabang
/ip address add address=10.10.20.1/24 interface=ether2
/ip pool add name=pppoe-pool ranges=10.10.20.2-10.10.20.254
/ppp profile add name=pppoe-profile local-address=10.10.20.1 remote-address=pppoe-pool dns-server=8.8.8.8,8.8.4.4 rate-limit=10M/10M
/interface pppoe-server server add service-name=detso-pppoe interface=ether2 default-profile=pppoe-profile authentication=pap,chap,mschap1,mschap2 disabled=no
/radius add address=172.17.0.1 secret=detso-radius-secret service=ppp authentication-port=1812 accounting-port=1813 timeout=3000ms disabled=yes
/ppp aaa set use-radius=yes accounting=yes interim-update=5m
/ppp secret add name=test-user password=test123 profile=pppoe-profile service=pppoe
/quit
MIKROTIK_COMMANDS
' 2>&1 | tail -5

echo "✅ Router Cabang commands sent"
echo ""

# ==========================================
# VERIFY CONFIGURATION
# ==========================================
echo "============================================================"
echo "📋 Verifying Configuration..."
echo "============================================================"
echo ""

echo "--- Router Pusat ---"
docker exec routeros_pusat bash -c '
cat << "MIKROTIK_COMMANDS" | timeout 10 telnet localhost 23 2>/dev/null
admin

/interface pppoe-server server print
/ip pool print
/ppp profile print where name=pppoe-profile
/radius print
/quit
MIKROTIK_COMMANDS
' 2>&1 | grep -E "(service-name|ranges|name|address|disabled)" | head -10

echo ""
echo "--- Router Cabang ---"
docker exec routeros_cabang bash -c '
cat << "MIKROTIK_COMMANDS" | timeout 10 telnet localhost 23 2>/dev/null
admin

/interface pppoe-server server print
/ip pool print
/ppp profile print where name=pppoe-profile
/radius print
/quit
MIKROTIK_COMMANDS
' 2>&1 | grep -E "(service-name|ranges|name|address|disabled)" | head -10

echo ""
echo "============================================================"
echo "🎉 SETUP COMPLETE!"
echo "============================================================"
echo ""
echo "📝 Configuration Applied:"
echo "   Router Pusat:"
echo "     - PPPoE Server: detso-pppoe on ether2"
echo "     - IP Pool: 10.10.10.2-10.10.10.254"
echo "     - Local IP: 10.10.10.1/24"
echo "     - RADIUS: 172.17.0.1:1812 (DISABLED)"
echo ""
echo "   Router Cabang:"
echo "     - PPPoE Server: detso-pppoe on ether2"
echo "     - IP Pool: 10.10.20.2-10.10.20.254"
echo "     - Local IP: 10.10.20.1/24"
echo "     - RADIUS: 172.17.0.1:1812 (DISABLED)"
echo ""
echo "📝 Test Credentials:"
echo "   Username: test-user"
echo "   Password: test123"
echo ""
echo "📝 Next Steps:"
echo "   1. Install FreeRADIUS (Docker)"
echo "   2. Configure FreeRADIUS database"
echo "   3. Add NAS clients to FreeRADIUS"
echo "   4. Enable RADIUS: /radius set 0 disabled=no"
echo "   5. Test PPPoE with RADIUS auth"
