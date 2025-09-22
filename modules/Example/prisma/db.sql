
-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."${TABLE_PREFIX}examples" (
    "id" UUID NOT NULL PRIMARY KEY,
    "client_id" UUID,
    "parent_id" UUID,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "external" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status_id" SMALLINT NOT NULL DEFAULT 1
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "${TABLE_PREFIX}examples_parent_id_idx" ON "public"."${TABLE_PREFIX}examples"("parent_id");
