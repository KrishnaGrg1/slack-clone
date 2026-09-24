-- +goose Up
ALTER TABLE workspaces
ADD COLUMN invite_code TEXT UNIQUE,
ADD COLUMN invite_expires_at TIMESTAMPTZ;

-- +goose Down

