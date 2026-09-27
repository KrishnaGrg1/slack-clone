-- +goose Up
CREATE TABLE channels (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    name         TEXT NOT NULL,
    topic        TEXT,
    channel_type TEXT NOT NULL DEFAULT 'public', -- 'public' | 'private'
    created_by   UUID REFERENCES users(id),
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE channel_members (
    channel_id      UUID REFERENCES channels(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    role            TEXT NOT NULL DEFAULT 'member', -- 'admin' | 'member'
    joined_at       TIMESTAMPTZ DEFAULT NOW(),
    -- tracks where the user has read up to for unread badge counts
    last_read_at    TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (channel_id, user_id)
);

CREATE INDEX idx_channels_workspace ON channels(workspace_id);

-- +goose Down
DROP TABLE IF EXISTS channel_members CASCADE;
DROP TABLE IF EXISTS channels CASCADE;