--- BASE SQL

-- CREATE EXTENSION IF NOT EXISTS vector;

-- CreateTable
CREATE TABLE "public"."app_users" (
    "id" UUID NOT NULL,
    "client_id" UUID,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "google_id" TEXT,
    "x_id" TEXT,
    "github_id" TEXT,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(16),
    "alias" VARCHAR(10),
    "description" TEXT,
    "avatar" VARCHAR(512),
    "last_seen" TIMESTAMPTZ,
    "ip" VARCHAR(45),
    "balance" DECIMAL(18,4) NOT NULL DEFAULT 0.00,
    "credit" DECIMAL(18,4) NOT NULL DEFAULT 0.00,
    "session_token" VARCHAR(45),
    "session_expires" TIMESTAMPTZ,
    "verification_token" VARCHAR(45),
    "verification_token_expires" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status_id" SMALLINT NOT NULL DEFAULT 1,

    CONSTRAINT "app_users_pkey" PRIMARY KEY ("id")
);


-- CreateIndex
CREATE UNIQUE INDEX "app_users_email_key" ON "public"."app_users"("email");

-- CreateIndex
CREATE INDEX "app_users_email_idx" ON "public"."app_users"("email");
CREATE UNIQUE INDEX "app_users_google_id_key" ON "public"."app_users"("google_id");
CREATE UNIQUE INDEX "app_users_x_id_key" ON "public"."app_users"("x_id");
CREATE UNIQUE INDEX "app_users_github_id_key" ON "public"."app_users"("github_id");

CREATE TABLE "public"."app_sessions" (
    "id" UUID NOT NULL PRIMARY KEY,
    "client_id" UUID,
    "user_id" UUID,
    "token" VARCHAR(255),
    "device" VARCHAR(45),
    "login_at" TIMESTAMPTZ,
    "last_seen" TIMESTAMPTZ,
    "ip" VARCHAR(45),
    "lat" DOUBLE PRECISION,
    "lon" DOUBLE PRECISION,
    "status_id" SMALLINT NOT NULL DEFAULT 1
);


-- CreateTable
CREATE TABLE "public"."app_clients" (
    "id" UUID NOT NULL,
    "parent_id" UUID,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "balance" DECIMAL(18,4) NOT NULL DEFAULT 0.00,
    "credit" DECIMAL(18,4) NOT NULL DEFAULT 0.00,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status_id" SMALLINT NOT NULL DEFAULT 1,

    CONSTRAINT "app_clients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "app_clients_parent_id_idx" ON "public"."app_clients"("parent_id");

-- CreateTable
CREATE TABLE "public"."app_outbox_email" (
    "id" UUID NOT NULL,
    "track_id" UUID,
    "client_id" UUID,
    "user_id" UUID,
    "customer_id" UUID,
    "date_send" TIMESTAMPTZ,
    "date_read" TIMESTAMPTZ,
    "mod_name" VARCHAR(45),
    "ref_id" VARCHAR(45),
    "recipient" JSONB NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "properties" JSONB NOT NULL,
    "resend" SMALLINT NOT NULL DEFAULT 1,
    "status_id" SMALLINT NOT NULL DEFAULT 1,

    CONSTRAINT "app_outbox_email_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "app_outbox_email_track_id_idx" ON "public"."app_outbox_email"("track_id");

-- CreateTable
CREATE TABLE "public"."app_client_user_maps" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role_id" UUID,
    "ref_id" SMALLINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status_id" SMALLINT NOT NULL DEFAULT 1,

    CONSTRAINT "app_client_user_maps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "app_client_user_maps_client_id_idx" ON "public"."app_client_user_maps"("client_id");

-- CreateTable
CREATE TABLE "public"."app_groups" (
    "id" UUID NOT NULL,
    "client_id" UUID,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" SMALLINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status_id" SMALLINT NOT NULL DEFAULT 1,

    CONSTRAINT "app_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."app_group_permissions" (
    "id" UUID NOT NULL,
    "client_id" UUID,
    "group_id" UUID,
    "name" TEXT NOT NULL,
    "resource" TEXT,
    "action" TEXT,
    "order" SMALLINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status_id" SMALLINT NOT NULL DEFAULT 1,

    CONSTRAINT "app_group_permissions_pkey" PRIMARY KEY ("id"),

    CONSTRAINT "app_group_permissions_group_id_fkey" 
      FOREIGN KEY ("group_id")
      REFERENCES "public"."app_groups"("id") 
      ON DELETE SET NULL 
      ON UPDATE CASCADE

);

-- CreateIndex
CREATE INDEX "app_groups_client_id_idx" ON "public"."app_groups"("client_id");

-- CreateIndex
CREATE INDEX "app_group_permissions_client_id_idx" ON "public"."app_group_permissions"("client_id");

-- CreateIndex
CREATE INDEX "app_group_permissions_group_id_idx" ON "public"."app_group_permissions"("group_id");

-- CreateTable
CREATE TABLE "public"."app_group_user_maps" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status_id" SMALLINT NOT NULL DEFAULT 1,

    CONSTRAINT "app_group_user_maps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "app_group_user_maps_client_id_idx" ON "public"."app_group_user_maps"("client_id");
CREATE INDEX "app_group_user_maps_group_id_idx" ON "public"."app_group_user_maps"("group_id");
CREATE INDEX "app_group_user_maps_user_id_idx" ON "public"."app_group_user_maps"("user_id");

CREATE TABLE "public"."app_categories" (
    "id" UUID NOT NULL,
    "parent_id" UUID NULL,
    "client_id" UUID NULL,
    "section" VARCHAR(128) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NULL,
    "order" SMALLINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status_id" SMALLINT NOT NULL DEFAULT 1,

  CONSTRAINT "app_categories_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "app_categories_client_id_idx" ON "public"."app_categories" ("client_id");
CREATE INDEX "app_categories_parent_id_idx" ON "public"."app_categories" ("parent_id");


-- CreateTable
CREATE TABLE "public"."app_configurations" (
    "id" UUID NOT NULL,
    "client_id" UUID,
    "section" TEXT NOT NULL,
    "sub" TEXT,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT,
    "title" TEXT,
    "note" TEXT,
    "order" SMALLINT NOT NULL DEFAULT 0,
    "public" BOOLEAN NOT NULL DEFAULT false,
    "pro" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status_id" SMALLINT NOT NULL DEFAULT 1,

    CONSTRAINT "app_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "app_configurations_client_id_idx" ON "public"."app_configurations"("client_id");

-- CreateIndex
CREATE INDEX "app_configurations_key_idx" ON "public"."app_configurations"("key");

-- CreateTable
CREATE TABLE "public"."app_password_reset_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "used" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "app_password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "app_password_reset_tokens_token_key" ON "public"."app_password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "app_password_reset_tokens_user_id_idx" ON "public"."app_password_reset_tokens"("user_id");

-- CreateIndex
CREATE INDEX "app_password_reset_tokens_token_idx" ON "public"."app_password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "app_client_user_maps_user_id_idx" ON "public"."app_client_user_maps"("user_id");

-- CreateTable
CREATE TABLE "public"."app_log_ai" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "client_id" UUID,
    "access_date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    "endpoint" VARCHAR(128) NOT NULL,
    "module" VARCHAR(20),
    "ref_id" VARCHAR(41),
    "platform" VARCHAR(20),
    "url" VARCHAR(128),
    "model" VARCHAR(50),
    "stream" BOOLEAN NOT NULL DEFAULT false,

    "tokens_in" INTEGER,
    "tokens_out" INTEGER,
    "tokens_total" INTEGER,

    "request_headers" JSONB,
    "request_body" JSONB,
    "result" TEXT,
    "result_code" INTEGER,

    "process_time" INTEGER,

    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    "status_id" SMALLINT NOT NULL DEFAULT 1,

    CONSTRAINT "app_log_ai_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "app_log_ai_user_id_idx" ON "public"."app_log_ai" ("user_id");
CREATE INDEX "app_log_ai_access_date_idx" ON "public"."app_log_ai" ("access_date");
CREATE INDEX "app_log_ai_endpoint_idx" ON "public"."app_log_ai" ("endpoint");
CREATE INDEX "app_log_ai_model_idx" ON "public"."app_log_ai" ("model");
CREATE INDEX "app_log_ai_status_id_idx" ON "public"."app_log_ai" ("status_id");
CREATE INDEX "app_log_ai_module_ref_id_idx" ON "public"."app_log_ai" ("module", "ref_id");

-- ===================================================================================================================
-- CONVERSATION
-- ===================================================================================================================

-- =========================
-- Enums
-- =========================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_message_role') THEN
    CREATE TYPE app_message_role AS ENUM ('user', 'assistant', 'system', 'tool');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_participant_role') THEN
    CREATE TYPE app_participant_role AS ENUM ('owner', 'editor', 'viewer');
  END IF;
END$$;


-- =========================
-- conversations
-- =========================
CREATE TABLE IF NOT EXISTS "public"."app_conversations" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "client_id" UUID,
  "title" VARCHAR(255),
  "created_by" UUID,
  "last_message_at" TIMESTAMPTZ,
  "is_archived" BOOLEAN NOT NULL DEFAULT FALSE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMPTZ,
  "status_id" SMALLINT NOT NULL DEFAULT 1,

  CONSTRAINT "app_conversations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "app_conversations_created_by_fkey"
    FOREIGN KEY ("created_by")
    REFERENCES "public"."app_users" ("id")
    ON UPDATE CASCADE
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "app_conversations_created_by_idx"
  ON "public"."app_conversations" ("created_by");
CREATE INDEX IF NOT EXISTS "app_conversations_last_message_at_idx"
  ON "public"."app_conversations" ("last_message_at");

-- =========================
-- conversation_participants
-- =========================
CREATE TABLE IF NOT EXISTS "public"."app_conversation_participants" (
  "id" UUID NOT NULL,
  "conversation_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "role" VARCHAR(10) NOT NULL DEFAULT 'viewer',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "app_conversation_participants_pkey" PRIMARY KEY ("id"),

  CONSTRAINT "app_conversation_participants_conversation_id_fkey"
    FOREIGN KEY ("conversation_id")
    REFERENCES "public"."app_conversations" ("id")
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  CONSTRAINT "app_conversation_participants_user_id_fkey"
    FOREIGN KEY ("user_id")
    REFERENCES "public"."app_users" ("id")
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "app_conversation_participants_user_id_idx"
  ON "public"."app_conversation_participants" ("user_id");

-- =========================
-- messages
-- =========================
CREATE TABLE IF NOT EXISTS "public"."app_messages" (
  "id" UUID NOT NULL,
  "conversation_id" UUID NOT NULL,
  "parent_id" UUID,
  "role" VARCHAR(10),
  "user_id" UUID,
  "client_id" UUID,

  "endpoint" VARCHAR(100),
  "model" VARCHAR(100),

  "content" TEXT,
  "content_json" JSONB,

  "tool_name" VARCHAR(80),
  "tool_call_id" VARCHAR(80),

  "prompt_tokens" INTEGER,
  "completion_tokens" INTEGER,
  "total_tokens" INTEGER,
  "latency_ms" INTEGER,
  "cost_input" DECIMAL(18,6),
  "cost_output" DECIMAL(18,6),

  "status_code" INTEGER,
  "error_message" TEXT,

  "request_headers" JSONB,
  "request_body" JSONB,

  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMPTZ,
  "status_id" SMALLINT NOT NULL DEFAULT 1,

  CONSTRAINT "app_messages_pkey" PRIMARY KEY ("id"),

  CONSTRAINT "app_messages_conversation_id_fkey"
    FOREIGN KEY ("conversation_id")
    REFERENCES "public"."app_conversations" ("id")
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  CONSTRAINT "app_messages_parent_id_fkey"
    FOREIGN KEY ("parent_id")
    REFERENCES "public"."app_messages" ("id")
    ON UPDATE CASCADE
    ON DELETE SET NULL,

  CONSTRAINT "app_messages_user_id_fkey"
    FOREIGN KEY ("user_id")
    REFERENCES "public"."app_users" ("id")
    ON UPDATE CASCADE
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "app_messages_conversation_id_created_at_idx"
  ON "public"."app_messages" ("conversation_id", "created_at");
CREATE INDEX IF NOT EXISTS "app_messages_parent_id_idx"
  ON "public"."app_messages" ("parent_id");
CREATE INDEX IF NOT EXISTS "app_messages_role_idx"
  ON "public"."app_messages" ("role");
CREATE INDEX IF NOT EXISTS "app_messages_model_idx"
  ON "public"."app_messages" ("model");
CREATE INDEX IF NOT EXISTS "app_messages_status_id_idx"
  ON "public"."app_messages" ("status_id");

-- =========================
-- message_attachments
-- =========================
CREATE TABLE IF NOT EXISTS "public"."app_message_attachments" (
  "id" UUID NOT NULL,
  "message_id" UUID NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "mime_type" VARCHAR(120),
  "size_bytes" INTEGER,
  "url" VARCHAR(2048),
  "meta" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status_id"  SMALLINT NOT NULL DEFAULT 1,

  CONSTRAINT "app_message_attachments_pkey" PRIMARY KEY ("id"),

  CONSTRAINT "app_message_attachments_message_id_fkey"
    FOREIGN KEY ("message_id")
    REFERENCES "public"."app_messages" ("id")
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "app_message_attachments_message_id_idx"
  ON "public"."app_message_attachments" ("message_id");

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."app_modules" (
    "id" UUID NOT NULL,
    "client_id" UUID,
    "path" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "version" VARCHAR(10) NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status_id" SMALLINT NOT NULL DEFAULT 1,

    CONSTRAINT "app_modules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "app_modules_client_id_idx" ON "public"."app_modules"("client_id");

-- ====================================================================================================
-- MULTI SCHEMA FILE EXAMPLE
-- ====================================================================================================

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."multi_schema_file_example" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "multi_schema_file_example_pkey" PRIMARY KEY ("id")
);


-- ====================================================================================================
-- MCP 
-- ====================================================================================================

-- Tabel MCP Servers
CREATE TABLE IF NOT EXISTS "app_mcps" (
    "id"                  UUID PRIMARY KEY,
    "client_id"           UUID,
    "name"                VARCHAR(100) NOT NULL,
    "transport"           VARCHAR(50),
    "command"             VARCHAR(255),
    "args"                JSONB,
    "url"                 VARCHAR(2048),
    "env"                 JSONB,
    "headers"             JSONB,
    "timeout"             INTEGER,
    "reconnect"           BOOLEAN,
    "reconnect_interval"  INTEGER,
    "retries"             INTEGER,
    "stream_options"      JSONB,
    "created_at"          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at"          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "status_id"           SMALLINT NOT NULL DEFAULT 1

);

-- Tabel MCP Tools (opsional, untuk menyimpan daftar tools per server)
CREATE TABLE "app_mcp_tools" (
    "id"          UUID PRIMARY KEY,
    "mcp_id"      UUID NOT NULL REFERENCES "app_mcps"(id) ON DELETE CASCADE ON UPDATE CASCADE,
    "name"        VARCHAR(100) NOT NULL,
    "config"      JSONB,
    "created_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "status_id" SMALLINT NOT NULL DEFAULT 1
);

