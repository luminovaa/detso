/*
  Warnings:

  - You are about to drop the `detso_whatsapp_logs` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Detso_Network_Node_Type" AS ENUM ('SERVER', 'ODP');

-- CreateEnum
CREATE TYPE "Detso_Link_Type" AS ENUM ('FIBER', 'DROP_CABLE');

-- DropForeignKey
ALTER TABLE "detso_whatsapp_logs" DROP CONSTRAINT "detso_whatsapp_logs_customer_id_fkey";

-- AlterTable
ALTER TABLE "detso_refresh_tokens" ADD COLUMN     "last_used_at" TIMESTAMP(3),
ADD COLUMN     "rotated_from" TEXT;

-- AlterTable
ALTER TABLE "detso_tenants" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "lat" TEXT,
ADD COLUMN     "long" TEXT;

-- AlterTable
ALTER TABLE "detso_work_schedules" ADD COLUMN     "image" TEXT;

-- DropTable
DROP TABLE "detso_whatsapp_logs";

-- CreateTable
CREATE TABLE "detso_network_nodes" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "type" "Detso_Network_Node_Type" NOT NULL,
    "name" TEXT NOT NULL,
    "lat" TEXT NOT NULL,
    "long" TEXT NOT NULL,
    "address" TEXT,
    "slot" INTEGER,
    "notes" TEXT,
    "parent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "detso_network_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detso_network_links" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "from_node_id" TEXT NOT NULL,
    "to_node_id" TEXT,
    "to_service_id" TEXT,
    "type" "Detso_Link_Type" NOT NULL,
    "waypoints" JSONB,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "detso_network_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detso_mikrotik_routers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "api_port" INTEGER NOT NULL DEFAULT 8728,
    "api_username" TEXT NOT NULL,
    "api_password" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_online" BOOLEAN NOT NULL DEFAULT false,
    "last_seen_at" TIMESTAMP(3),
    "board_name" TEXT,
    "routeros_version" TEXT,
    "architecture" TEXT,
    "cpu_model" TEXT,
    "cpu_count" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "detso_mikrotik_routers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detso_mikrotik_monitoring" (
    "id" TEXT NOT NULL,
    "router_id" TEXT NOT NULL,
    "cpu_load" DOUBLE PRECISION NOT NULL,
    "memory_used" BIGINT NOT NULL,
    "memory_total" BIGINT NOT NULL,
    "disk_used" BIGINT NOT NULL,
    "disk_total" BIGINT NOT NULL,
    "uptime" TEXT NOT NULL,
    "active_sessions" INTEGER NOT NULL DEFAULT 0,
    "temperature" DOUBLE PRECISION,
    "voltage" DOUBLE PRECISION,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "detso_mikrotik_monitoring_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detso_mikrotik_interfaces" (
    "id" TEXT NOT NULL,
    "router_id" TEXT NOT NULL,
    "interface_name" TEXT NOT NULL,
    "interface_type" TEXT NOT NULL,
    "mac_address" TEXT,
    "mtu" INTEGER,
    "is_running" BOOLEAN NOT NULL DEFAULT false,
    "is_disabled" BOOLEAN NOT NULL DEFAULT false,
    "rx_bytes" BIGINT NOT NULL DEFAULT 0,
    "tx_bytes" BIGINT NOT NULL DEFAULT 0,
    "rx_packets" BIGINT NOT NULL DEFAULT 0,
    "tx_packets" BIGINT NOT NULL DEFAULT 0,
    "rx_errors" INTEGER NOT NULL DEFAULT 0,
    "tx_errors" INTEGER NOT NULL DEFAULT 0,
    "rx_drops" INTEGER NOT NULL DEFAULT 0,
    "tx_drops" INTEGER NOT NULL DEFAULT 0,
    "rx_bps" BIGINT NOT NULL DEFAULT 0,
    "tx_bps" BIGINT NOT NULL DEFAULT 0,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "detso_mikrotik_interfaces_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "detso_network_nodes_tenant_id_idx" ON "detso_network_nodes"("tenant_id");

-- CreateIndex
CREATE INDEX "detso_network_nodes_type_idx" ON "detso_network_nodes"("type");

-- CreateIndex
CREATE INDEX "detso_network_nodes_parent_id_idx" ON "detso_network_nodes"("parent_id");

-- CreateIndex
CREATE INDEX "detso_network_nodes_deleted_at_idx" ON "detso_network_nodes"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "detso_network_links_to_service_id_key" ON "detso_network_links"("to_service_id");

-- CreateIndex
CREATE INDEX "detso_network_links_tenant_id_idx" ON "detso_network_links"("tenant_id");

-- CreateIndex
CREATE INDEX "detso_network_links_from_node_id_idx" ON "detso_network_links"("from_node_id");

-- CreateIndex
CREATE INDEX "detso_network_links_to_node_id_idx" ON "detso_network_links"("to_node_id");

-- CreateIndex
CREATE INDEX "detso_network_links_to_service_id_idx" ON "detso_network_links"("to_service_id");

-- CreateIndex
CREATE INDEX "detso_mikrotik_routers_tenant_id_idx" ON "detso_mikrotik_routers"("tenant_id");

-- CreateIndex
CREATE INDEX "detso_mikrotik_routers_is_active_idx" ON "detso_mikrotik_routers"("is_active");

-- CreateIndex
CREATE INDEX "detso_mikrotik_routers_is_online_idx" ON "detso_mikrotik_routers"("is_online");

-- CreateIndex
CREATE INDEX "detso_mikrotik_routers_deleted_at_idx" ON "detso_mikrotik_routers"("deleted_at");

-- CreateIndex
CREATE INDEX "detso_mikrotik_routers_last_seen_at_idx" ON "detso_mikrotik_routers"("last_seen_at");

-- CreateIndex
CREATE INDEX "detso_mikrotik_monitoring_router_id_recorded_at_idx" ON "detso_mikrotik_monitoring"("router_id", "recorded_at");

-- CreateIndex
CREATE INDEX "detso_mikrotik_monitoring_recorded_at_idx" ON "detso_mikrotik_monitoring"("recorded_at");

-- CreateIndex
CREATE INDEX "detso_mikrotik_interfaces_router_id_interface_name_recorded_idx" ON "detso_mikrotik_interfaces"("router_id", "interface_name", "recorded_at");

-- CreateIndex
CREATE INDEX "detso_mikrotik_interfaces_recorded_at_idx" ON "detso_mikrotik_interfaces"("recorded_at");

-- CreateIndex
CREATE INDEX "detso_refresh_tokens_last_used_at_idx" ON "detso_refresh_tokens"("last_used_at");

-- CreateIndex
CREATE INDEX "detso_tenants_deleted_at_idx" ON "detso_tenants"("deleted_at");

-- AddForeignKey
ALTER TABLE "detso_network_nodes" ADD CONSTRAINT "detso_network_nodes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "detso_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detso_network_nodes" ADD CONSTRAINT "detso_network_nodes_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "detso_network_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detso_network_links" ADD CONSTRAINT "detso_network_links_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "detso_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detso_network_links" ADD CONSTRAINT "detso_network_links_from_node_id_fkey" FOREIGN KEY ("from_node_id") REFERENCES "detso_network_nodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detso_network_links" ADD CONSTRAINT "detso_network_links_to_node_id_fkey" FOREIGN KEY ("to_node_id") REFERENCES "detso_network_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detso_network_links" ADD CONSTRAINT "detso_network_links_to_service_id_fkey" FOREIGN KEY ("to_service_id") REFERENCES "detso_service_connections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detso_mikrotik_routers" ADD CONSTRAINT "detso_mikrotik_routers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "detso_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detso_mikrotik_monitoring" ADD CONSTRAINT "detso_mikrotik_monitoring_router_id_fkey" FOREIGN KEY ("router_id") REFERENCES "detso_mikrotik_routers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detso_mikrotik_interfaces" ADD CONSTRAINT "detso_mikrotik_interfaces_router_id_fkey" FOREIGN KEY ("router_id") REFERENCES "detso_mikrotik_routers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
