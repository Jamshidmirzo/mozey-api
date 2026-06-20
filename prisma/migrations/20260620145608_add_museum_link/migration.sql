-- AlterTable
ALTER TABLE "regions" ALTER COLUMN "id" DROP DEFAULT;

-- CreateTable
CREATE TABLE "museum_links" (
    "id" UUID NOT NULL,
    "museum_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "kind" VARCHAR(32) NOT NULL DEFAULT 'website',
    "label" JSONB,
    "order_idx" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "museum_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "museum_links_museum_id_idx" ON "museum_links"("museum_id");

-- AddForeignKey
ALTER TABLE "museum_links" ADD CONSTRAINT "museum_links_museum_id_fkey" FOREIGN KEY ("museum_id") REFERENCES "museums"("id") ON DELETE CASCADE ON UPDATE CASCADE;
