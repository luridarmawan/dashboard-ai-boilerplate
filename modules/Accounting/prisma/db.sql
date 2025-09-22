
-- CreateTable
CREATE TABLE IF NOT EXISTS "${TABLE_PREFIX}expenses" (
  "id" UUID NOT NULL PRIMARY KEY,
  client_id UUID,
  user_id TEXT,
  post_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  doc_id TEXT,
  category_id UUID,
  amount DECIMAL(18,4) NOT NULL DEFAULT 0.00,
  store_name TEXT,
  store_branch TEXT,
  order_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  order_id TEXT,
  tax DECIMAL(18,4) NOT NULL DEFAULT 0.00,
  payment_method TEXT,
  is_ocr BOOLEAN NOT NULL DEFAULT false,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  is_duplicate BOOLEAN NOT NULL DEFAULT false,
  approved_by TEXT,
  approved_date TIMESTAMPTZ,
  metadata JSONB,
  status_id SMALLINT NOT NULL DEFAULT 1
);
