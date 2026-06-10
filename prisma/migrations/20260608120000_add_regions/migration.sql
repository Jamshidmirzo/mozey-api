-- CreateTable
CREATE TABLE "regions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" JSONB NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "order_idx" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "regions_slug_key" ON "regions"("slug");

-- CreateIndex
CREATE INDEX "regions_updated_at_idx" ON "regions"("updated_at");

-- CreateIndex
CREATE INDEX "regions_order_idx_idx" ON "regions"("order_idx");

-- AlterTable: Add region_id to museums
ALTER TABLE "museums" ADD COLUMN "region_id" UUID;

-- CreateIndex
CREATE INDEX "museums_region_id_idx" ON "museums"("region_id");

-- AddForeignKey
ALTER TABLE "museums" ADD CONSTRAINT "museums_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: Add region_id to historical_places
ALTER TABLE "historical_places" ADD COLUMN "region_id" UUID;

-- CreateIndex
CREATE INDEX "historical_places_region_id_idx" ON "historical_places"("region_id");

-- AddForeignKey
ALTER TABLE "historical_places" ADD CONSTRAINT "historical_places_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
