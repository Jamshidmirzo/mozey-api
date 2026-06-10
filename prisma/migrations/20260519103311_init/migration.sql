-- CreateTable
CREATE TABLE "museums" (
    "id" UUID NOT NULL,
    "legacy_id" INTEGER,
    "name" JSONB NOT NULL,
    "description" JSONB NOT NULL,
    "ticket_price" JSONB NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "city" VARCHAR(255) NOT NULL,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "museums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "museum_photos" (
    "id" UUID NOT NULL,
    "museum_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "order_idx" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "museum_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historical_places" (
    "id" UUID NOT NULL,
    "legacy_id" INTEGER,
    "name" JSONB NOT NULL,
    "description" JSONB NOT NULL,
    "ticket_price" JSONB NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "city" VARCHAR(255) NOT NULL,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "historical_places_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historical_place_photos" (
    "id" UUID NOT NULL,
    "historical_place_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "order_idx" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historical_place_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_users" (
    "id" UUID NOT NULL,
    "device_id" TEXT NOT NULL,
    "locale" VARCHAR(5),
    "app_version" VARCHAR(20),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_actions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "entity_type" VARCHAR(20) NOT NULL,
    "entity_id" UUID NOT NULL,
    "action_type" VARCHAR(10) NOT NULL,
    "client_event_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" VARCHAR(20) NOT NULL DEFAULT 'editor',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" UUID NOT NULL,
    "admin_id" UUID NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID NOT NULL,
    "diff" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "museums_legacy_id_key" ON "museums"("legacy_id");

-- CreateIndex
CREATE INDEX "museums_updated_at_idx" ON "museums"("updated_at");

-- CreateIndex
CREATE INDEX "museums_is_published_idx" ON "museums"("is_published");

-- CreateIndex
CREATE INDEX "museums_city_idx" ON "museums"("city");

-- CreateIndex
CREATE INDEX "museum_photos_museum_id_idx" ON "museum_photos"("museum_id");

-- CreateIndex
CREATE UNIQUE INDEX "historical_places_legacy_id_key" ON "historical_places"("legacy_id");

-- CreateIndex
CREATE INDEX "historical_places_updated_at_idx" ON "historical_places"("updated_at");

-- CreateIndex
CREATE INDEX "historical_places_is_published_idx" ON "historical_places"("is_published");

-- CreateIndex
CREATE INDEX "historical_places_city_idx" ON "historical_places"("city");

-- CreateIndex
CREATE INDEX "historical_place_photos_historical_place_id_idx" ON "historical_place_photos"("historical_place_id");

-- CreateIndex
CREATE UNIQUE INDEX "app_users_device_id_key" ON "app_users"("device_id");

-- CreateIndex
CREATE INDEX "user_actions_user_id_entity_type_entity_id_created_at_idx" ON "user_actions"("user_id", "entity_type", "entity_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "user_actions_user_id_client_event_id_key" ON "user_actions"("user_id", "client_event_id");

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE INDEX "audit_log_admin_id_idx" ON "audit_log"("admin_id");

-- CreateIndex
CREATE INDEX "audit_log_entity_type_entity_id_idx" ON "audit_log"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_log_created_at_idx" ON "audit_log"("created_at");

-- AddForeignKey
ALTER TABLE "museum_photos" ADD CONSTRAINT "museum_photos_museum_id_fkey" FOREIGN KEY ("museum_id") REFERENCES "museums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historical_place_photos" ADD CONSTRAINT "historical_place_photos_historical_place_id_fkey" FOREIGN KEY ("historical_place_id") REFERENCES "historical_places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_actions" ADD CONSTRAINT "user_actions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
