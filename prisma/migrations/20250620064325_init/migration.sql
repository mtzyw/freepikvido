-- CreateEnum
CREATE TYPE "Provider" AS ENUM ('local', 'apple', 'google', 'canva');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('image_to_video', 'text_to_video');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('pending', 'processing', 'success', 'failed');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'paid', 'failed', 'refunded', 'cancelled');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('apple', 'stripe', 'other');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT,
    "password_hash" TEXT,
    "name" VARCHAR(50),
    "provider" "Provider" NOT NULL DEFAULT 'local',
    "provider_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_tasks" (
    "task_id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "task_type" "TaskType" NOT NULL,
    "prompt" TEXT,
    "image_url" TEXT,
    "thumbnail_url" TEXT,
    "duration_seconds" INTEGER NOT NULL,
    "aspect_ratio" VARCHAR(20),
    "negative_prompt" TEXT,
    "cfg_scale" DECIMAL(3,2) NOT NULL DEFAULT 0.5,
    "static_mask_url" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'pending',
    "video_url" TEXT,
    "error_msg" TEXT,
    "freepik_task_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "video_tasks_pkey" PRIMARY KEY ("task_id")
);

-- CreateTable
CREATE TABLE "products" (
    "product_id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "duration_days" INTEGER NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("product_id")
);

-- CreateTable
CREATE TABLE "orders" (
    "order_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'pending',
    "payment_method" "PaymentMethod",
    "transaction_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("order_id")
);

-- CreateTable
CREATE TABLE "user_memberships" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "start_at" TIMESTAMP(3) NOT NULL,
    "expire_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" SERIAL NOT NULL,
    "api_key" VARCHAR(100) NOT NULL,
    "daily_limit" INTEGER NOT NULL,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "last_reset" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_provider_key" ON "users"("email", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "users_provider_provider_user_id_key" ON "users"("provider", "provider_user_id");

-- CreateIndex
CREATE INDEX "video_tasks_user_id_idx" ON "video_tasks"("user_id");

-- CreateIndex
CREATE INDEX "video_tasks_status_idx" ON "video_tasks"("status");

-- CreateIndex
CREATE INDEX "video_tasks_freepik_task_id_idx" ON "video_tasks"("freepik_task_id");

-- CreateIndex
CREATE INDEX "orders_user_id_idx" ON "orders"("user_id");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "user_memberships_expire_at_idx" ON "user_memberships"("expire_at");

-- CreateIndex
CREATE INDEX "user_memberships_user_id_idx" ON "user_memberships"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_memberships_user_id_product_id_key" ON "user_memberships"("user_id", "product_id");

-- CreateIndex
CREATE INDEX "api_keys_last_reset_idx" ON "api_keys"("last_reset");

-- CreateIndex
CREATE INDEX "api_keys_is_active_idx" ON "api_keys"("is_active");

-- AddForeignKey
ALTER TABLE "video_tasks" ADD CONSTRAINT "video_tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_memberships" ADD CONSTRAINT "user_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_memberships" ADD CONSTRAINT "user_memberships_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;
