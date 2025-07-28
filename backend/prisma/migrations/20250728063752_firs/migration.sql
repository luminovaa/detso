-- CreateEnum
CREATE TYPE "Detso_Role" AS ENUM ('TEKNISI', 'ADMIN', 'SUPER_ADMIN');

-- CreateTable
CREATE TABLE "detso_users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "role" "Detso_Role" NOT NULL DEFAULT 'TEKNISI',

    CONSTRAINT "detso_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detso_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "avatar" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "detso_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "detso_users_username_key" ON "detso_users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "detso_users_email_key" ON "detso_users"("email");

-- CreateIndex
CREATE INDEX "detso_users_deleted_at_idx" ON "detso_users"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "detso_profiles_user_id_key" ON "detso_profiles"("user_id");

-- CreateIndex
CREATE INDEX "detso_profiles_deleted_at_idx" ON "detso_profiles"("deleted_at");

-- AddForeignKey
ALTER TABLE "detso_profiles" ADD CONSTRAINT "detso_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "detso_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
