CREATE TABLE IF NOT EXISTS izaki_inquiries (
  id          BIGSERIAL PRIMARY KEY,
  company     TEXT        NOT NULL,
  name        TEXT        NOT NULL,
  email       TEXT        NOT NULL,
  phone       TEXT        NOT NULL DEFAULT '',
  message     TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
