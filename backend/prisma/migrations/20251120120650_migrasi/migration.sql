/*
  Warnings:

  - The values [TEKNISI,ADMIN,SUPER_ADMIN] on the enum `Detso_Role` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."TicketAction" AS ENUM ('CREATED', 'UPDATED', 'ASSIGNED', 'STATUS_CHANGED', 'PRIORITY_CHANGED', 'RESOLVED', 'CLOSED', 'REOPENED', 'SCHEDULED', 'NOTE_ADDED');

-- CreateEnum
CREATE TYPE "public"."TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."ScheduleStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."Detso_Customer_Status" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."TicketType" AS ENUM ('UPGRADE', 'DOWNGRADE', 'PROBLEM');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."Detso_Role_new" AS ENUM ('SAAS_SUPER_ADMIN', 'TENANT_OWNER', 'TENANT_ADMIN', 'TENANT_TEKNISI');
ALTER TABLE "public"."detso_users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "public"."detso_users" ALTER COLUMN "role" TYPE "public"."Detso_Role_new" USING ("role"::text::"public"."Detso_Role_new");
ALTER TYPE "public"."Detso_Role" RENAME TO "Detso_Role_old";
ALTER TYPE "public"."Detso_Role_new" RENAME TO "Detso_Role";
DROP TYPE "public"."Detso_Role_old";
ALTER TABLE "public"."detso_users" ALTER COLUMN "role" SET DEFAULT 'TENANT_TEKNISI';
COMMIT;

-- DropIndex
DROP INDEX "public"."detso_users_username_key";

-- AlterTable
ALTER TABLE "public"."detso_users" ADD COLUMN     "phone" TEXT,
ADD COLUMN     "tenant_id" TEXT,
ALTER COLUMN "role" SET DEFAULT 'TENANT_TEKNISI';

-- CreateTable
CREATE TABLE "public"."detso_tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "detso_tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."detso_refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "device_info" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "detso_refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."detso_customers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "nik" TEXT,
    "address" TEXT,
    "birth_date" TIMESTAMP(3),
    "birth_place" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "detso_customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."detso_whatsapp_logs" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT,
    "phone_number" TEXT NOT NULL,
    "message_type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error_message" TEXT,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "detso_whatsapp_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."detso_customer_documents" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT,
    "document_type" TEXT NOT NULL,
    "document_url" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "detso_customer_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."detso_service_connections" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "id_pel" TEXT,
    "package_id" TEXT NOT NULL,
    "address" TEXT,
    "package_name" TEXT NOT NULL,
    "package_speed" TEXT NOT NULL,
    "package_price" INTEGER,
    "ip_address" TEXT,
    "lat" TEXT,
    "long" TEXT,
    "mac_address" TEXT,
    "status" "public"."Detso_Customer_Status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "detso_service_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."detso_service_photos" (
    "id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "photo_type" TEXT NOT NULL,
    "photo_url" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "detso_service_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."detso_customer_pdfs" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "service_connection_id" TEXT NOT NULL,
    "pdf_type" TEXT NOT NULL DEFAULT 'installation_report',
    "pdf_path" TEXT NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "detso_customer_pdfs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."detso_packages" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "speed" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "detso_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."detso_tickets" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "service_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "public"."TicketType" NOT NULL DEFAULT 'PROBLEM',
    "priority" "public"."TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "public"."TicketStatus" NOT NULL DEFAULT 'OPEN',
    "assigned_to" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "resolved_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "detso_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."detso_ticket_history" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "action" "public"."TicketAction" NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "detso_ticket_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."detso_work_schedules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT,
    "ticket_id" TEXT,
    "technician_id" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),
    "status" "public"."ScheduleStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "detso_work_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "detso_tenants_name_key" ON "public"."detso_tenants"("name");

-- CreateIndex
CREATE UNIQUE INDEX "detso_tenants_slug_key" ON "public"."detso_tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "detso_refresh_tokens_token_key" ON "public"."detso_refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "detso_refresh_tokens_user_id_idx" ON "public"."detso_refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "detso_refresh_tokens_token_idx" ON "public"."detso_refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "detso_customers_tenant_id_idx" ON "public"."detso_customers"("tenant_id");

-- CreateIndex
CREATE INDEX "detso_customers_deleted_at_idx" ON "public"."detso_customers"("deleted_at");

-- CreateIndex
CREATE INDEX "detso_customers_phone_idx" ON "public"."detso_customers"("phone");

-- CreateIndex
CREATE INDEX "detso_customers_nik_idx" ON "public"."detso_customers"("nik");

-- CreateIndex
CREATE INDEX "detso_customer_documents_customer_id_idx" ON "public"."detso_customer_documents"("customer_id");

-- CreateIndex
CREATE INDEX "detso_service_connections_tenant_id_idx" ON "public"."detso_service_connections"("tenant_id");

-- CreateIndex
CREATE INDEX "detso_service_connections_deleted_at_idx" ON "public"."detso_service_connections"("deleted_at");

-- CreateIndex
CREATE INDEX "detso_service_photos_service_id_idx" ON "public"."detso_service_photos"("service_id");

-- CreateIndex
CREATE INDEX "detso_packages_tenant_id_idx" ON "public"."detso_packages"("tenant_id");

-- CreateIndex
CREATE INDEX "detso_tickets_tenant_id_idx" ON "public"."detso_tickets"("tenant_id");

-- CreateIndex
CREATE INDEX "detso_tickets_type_idx" ON "public"."detso_tickets"("type");

-- CreateIndex
CREATE INDEX "detso_tickets_status_idx" ON "public"."detso_tickets"("status");

-- CreateIndex
CREATE INDEX "detso_tickets_customer_id_idx" ON "public"."detso_tickets"("customer_id");

-- CreateIndex
CREATE INDEX "detso_tickets_assigned_to_idx" ON "public"."detso_tickets"("assigned_to");

-- CreateIndex
CREATE UNIQUE INDEX "detso_work_schedules_ticket_id_key" ON "public"."detso_work_schedules"("ticket_id");

-- CreateIndex
CREATE INDEX "detso_work_schedules_tenant_id_idx" ON "public"."detso_work_schedules"("tenant_id");

-- CreateIndex
CREATE INDEX "detso_users_tenant_id_idx" ON "public"."detso_users"("tenant_id");

-- AddForeignKey
ALTER TABLE "public"."detso_users" ADD CONSTRAINT "detso_users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."detso_tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."detso_refresh_tokens" ADD CONSTRAINT "detso_refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."detso_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."detso_customers" ADD CONSTRAINT "detso_customers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."detso_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."detso_whatsapp_logs" ADD CONSTRAINT "detso_whatsapp_logs_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."detso_customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."detso_customer_documents" ADD CONSTRAINT "detso_customer_documents_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."detso_customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."detso_service_connections" ADD CONSTRAINT "detso_service_connections_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."detso_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."detso_service_connections" ADD CONSTRAINT "detso_service_connections_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."detso_customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."detso_service_connections" ADD CONSTRAINT "detso_service_connections_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "public"."detso_packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."detso_service_photos" ADD CONSTRAINT "detso_service_photos_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."detso_service_connections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."detso_customer_pdfs" ADD CONSTRAINT "detso_customer_pdfs_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."detso_customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."detso_customer_pdfs" ADD CONSTRAINT "detso_customer_pdfs_service_connection_id_fkey" FOREIGN KEY ("service_connection_id") REFERENCES "public"."detso_service_connections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."detso_packages" ADD CONSTRAINT "detso_packages_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."detso_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."detso_tickets" ADD CONSTRAINT "detso_tickets_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."detso_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."detso_tickets" ADD CONSTRAINT "detso_tickets_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."detso_customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."detso_tickets" ADD CONSTRAINT "detso_tickets_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."detso_service_connections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."detso_tickets" ADD CONSTRAINT "detso_tickets_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."detso_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."detso_ticket_history" ADD CONSTRAINT "detso_ticket_history_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."detso_tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."detso_ticket_history" ADD CONSTRAINT "detso_ticket_history_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."detso_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."detso_work_schedules" ADD CONSTRAINT "detso_work_schedules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."detso_tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."detso_work_schedules" ADD CONSTRAINT "detso_work_schedules_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."detso_tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."detso_work_schedules" ADD CONSTRAINT "detso_work_schedules_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "public"."detso_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
