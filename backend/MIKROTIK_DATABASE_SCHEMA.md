# Mikrotik Monitoring Database Schema

## ✅ Implementation Status: COMPLETED

**Date**: 2026-05-05  
**Migration**: `20260505145513_add_mikrotik_monitoring`

---

## 📊 Database Tables Created

### 1. `detso_mikrotik_routers`
**Purpose**: Store Mikrotik router configuration per tenant

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key (CUID) |
| tenant_id | TEXT | Foreign key to detso_tenants |
| name | TEXT | Router name (e.g., "Router Pusat") |
| host | TEXT | IP address or hostname |
| api_port | INTEGER | Mikrotik API port (default: 8728) |
| api_username | TEXT | API username |
| api_password | TEXT | API password (encrypted) |
| is_active | BOOLEAN | Router enabled/disabled |
| is_online | BOOLEAN | Current online status |
| last_seen_at | TIMESTAMP | Last successful connection |
| board_name | TEXT | Hardware model |
| routeros_version | TEXT | RouterOS version |
| architecture | TEXT | CPU architecture (x86_64, arm) |
| cpu_model | TEXT | CPU model name |
| cpu_count | INTEGER | Number of CPU cores |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |
| deleted_at | TIMESTAMP | Soft delete timestamp |

**Indexes**:
- `tenant_id` - For tenant isolation
- `is_active` - For active router queries
- `is_online` - For online status filtering
- `deleted_at` - For soft delete queries
- `last_seen_at` - For monitoring health checks

**Relations**:
- `tenant` → `Detso_Tenant` (many-to-one)
- `monitoring_logs` → `Detso_Mikrotik_Monitoring` (one-to-many)
- `interfaces` → `Detso_Mikrotik_Interface` (one-to-many)

---

### 2. `detso_mikrotik_monitoring`
**Purpose**: Time-series data for system resources monitoring

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key (CUID) |
| router_id | TEXT | Foreign key to detso_mikrotik_routers |
| cpu_load | FLOAT | CPU usage percentage (0-100) |
| memory_used | BIGINT | Used memory in bytes |
| memory_total | BIGINT | Total memory in bytes |
| disk_used | BIGINT | Used disk space in bytes |
| disk_total | BIGINT | Total disk space in bytes |
| uptime | TEXT | System uptime (e.g., "15d7h23m") |
| active_sessions | INTEGER | Number of active PPPoE sessions |
| temperature | FLOAT | Hardware temperature (°C) - optional |
| voltage | FLOAT | Power supply voltage (V) - optional |
| recorded_at | TIMESTAMP | Data collection timestamp |

**Indexes**:
- `(router_id, recorded_at)` - Composite index for time-series queries
- `recorded_at` - For cleanup queries (delete old data)

**Relations**:
- `router` → `Detso_Mikrotik_Router` (many-to-one, CASCADE delete)

**Data Retention**: 30 days (configurable)

---

### 3. `detso_mikrotik_interfaces`
**Purpose**: Network interface statistics per router

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key (CUID) |
| router_id | TEXT | Foreign key to detso_mikrotik_routers |
| interface_name | TEXT | Interface name (e.g., "ether1") |
| interface_type | TEXT | Interface type (ether, pppoe, bridge) |
| mac_address | TEXT | MAC address |
| mtu | INTEGER | Maximum Transmission Unit |
| is_running | BOOLEAN | Interface up/down status |
| is_disabled | BOOLEAN | Interface enabled/disabled |
| rx_bytes | BIGINT | Total received bytes |
| tx_bytes | BIGINT | Total transmitted bytes |
| rx_packets | BIGINT | Total received packets |
| tx_packets | BIGINT | Total transmitted packets |
| rx_errors | INTEGER | Receive errors count |
| tx_errors | INTEGER | Transmit errors count |
| rx_drops | INTEGER | Receive drops count |
| tx_drops | INTEGER | Transmit drops count |
| rx_bps | BIGINT | Current RX bits per second |
| tx_bps | BIGINT | Current TX bits per second |
| recorded_at | TIMESTAMP | Data collection timestamp |

**Indexes**:
- `(router_id, interface_name, recorded_at)` - Composite index for interface queries
- `recorded_at` - For cleanup queries

**Relations**:
- `router` → `Detso_Mikrotik_Router` (many-to-one, CASCADE delete)

---

## 🔗 Entity Relationship

```
Detso_Tenant (1) ──────── (N) Detso_Mikrotik_Router
                                      │
                                      ├─── (N) Detso_Mikrotik_Monitoring
                                      │
                                      └─── (N) Detso_Mikrotik_Interface
```

---

## 📝 Migration Details

**Migration File**: `prisma/migrations/20260505145513_add_mikrotik_monitoring/migration.sql`

**Changes Applied**:
1. Created 3 new tables
2. Added foreign key constraints
3. Created 9 indexes for performance
4. Added relation to `Detso_Tenant` table

**Rollback**: Use `npx prisma migrate reset` (will delete all data)

---

## 🧪 Test Data Seeded

**Seeder Script**: `backend/seed-mikrotik.ts`

**Data Created**:
- ✅ 1 Test Tenant: "ISP Test"
- ✅ 1 Test User: owner@test.com / password123 (TENANT_OWNER)
- ✅ 2 Mikrotik Routers:
  - Router Pusat (localhost:8728)
  - Router Cabang A (localhost:8730)
- ✅ 20 Monitoring Records (10 per router, last 10 minutes)
- ✅ 6 Interface Records (3 per router: ether1, ether2, lo)

**Run Seeder**:
```bash
cd backend
npx tsx seed-mikrotik.ts
```

---

## 🔍 Query Examples

### Get All Active Routers for a Tenant
```sql
SELECT * FROM detso_mikrotik_routers
WHERE tenant_id = 'xxx'
  AND is_active = true
  AND deleted_at IS NULL;
```

### Get Latest Monitoring Data
```sql
SELECT * FROM detso_mikrotik_monitoring
WHERE router_id = 'router-pusat-test'
ORDER BY recorded_at DESC
LIMIT 1;
```

### Get Historical CPU Usage (Last 24 Hours)
```sql
SELECT 
  DATE_TRUNC('hour', recorded_at) as hour,
  AVG(cpu_load) as avg_cpu,
  MAX(cpu_load) as max_cpu,
  MIN(cpu_load) as min_cpu
FROM detso_mikrotik_monitoring
WHERE router_id = 'router-pusat-test'
  AND recorded_at > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;
```

### Get Interface Traffic Summary
```sql
SELECT 
  interface_name,
  is_running,
  rx_bps / 1000000 as rx_mbps,
  tx_bps / 1000000 as tx_mbps,
  rx_errors,
  tx_errors
FROM detso_mikrotik_interfaces
WHERE router_id = 'router-pusat-test'
  AND recorded_at = (
    SELECT MAX(recorded_at) 
    FROM detso_mikrotik_interfaces 
    WHERE router_id = 'router-pusat-test'
  );
```

### Cleanup Old Data (>30 Days)
```sql
DELETE FROM detso_mikrotik_monitoring
WHERE recorded_at < NOW() - INTERVAL '30 days';

DELETE FROM detso_mikrotik_interfaces
WHERE recorded_at < NOW() - INTERVAL '30 days';
```

---

## 🔐 Security Considerations

### Password Encryption
⚠️ **TODO**: Implement AES-256 encryption for `api_password` field

**Recommended Implementation**:
```typescript
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.MIKROTIK_ENCRYPTION_KEY; // 32 bytes
const IV_LENGTH = 16;

export function encryptPassword(password: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY), iv);
  
  let encrypted = cipher.update(password, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

export function decryptPassword(encrypted: string): string {
  const parts = encrypted.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encryptedText = parts[2];
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY), iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

### Multi-Tenant Isolation
✅ All queries MUST filter by `tenant_id`
✅ Foreign key constraints enforce data integrity
✅ Soft delete prevents accidental data loss

---

## 📊 Performance Optimization

### Indexing Strategy
- ✅ Composite indexes for time-series queries
- ✅ Single-column indexes for filtering
- ✅ Foreign key indexes for joins

### Data Retention
- **Monitoring data**: 30 days (configurable)
- **Interface data**: 30 days (configurable)
- **Router config**: Permanent (soft delete)

### Cleanup Job
**Recommended**: Daily cron job at 2 AM
```typescript
// Cleanup old monitoring data
await prisma.detso_Mikrotik_Monitoring.deleteMany({
  where: {
    recorded_at: {
      lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
    }
  }
});

// Cleanup old interface data
await prisma.detso_Mikrotik_Interface.deleteMany({
  where: {
    recorded_at: {
      lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    }
  }
});
```

---

## 🚀 Next Steps

1. **Backend Services** ✅ Ready to implement
   - `mikrotik.service.ts` - Mikrotik API wrapper
   - `monitoring.service.ts` - Business logic
   - `connection-pool.ts` - Connection management

2. **API Endpoints** ✅ Ready to implement
   - Router CRUD
   - Monitoring data retrieval
   - Real-time updates via WebSocket

3. **Background Worker** ✅ Ready to implement
   - Polling job (every 15 seconds)
   - Data cleanup job (daily)

4. **Mobile App** ✅ Ready to implement
   - Monitoring dashboard
   - Real-time charts
   - Router management

---

## 📚 References

- **Prisma Schema**: `backend/prisma/schema.prisma` (lines 387-471)
- **Migration**: `backend/prisma/migrations/20260505145513_add_mikrotik_monitoring/`
- **Seeder**: `backend/seed-mikrotik.ts`
- **Test Script**: `backend/test-mikrotik-connection.js`

---

**Status**: ✅ Database schema implementation COMPLETED  
**Next**: Backend services implementation

