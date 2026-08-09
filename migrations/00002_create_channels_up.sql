-- +goose Up

CREATE TABLE channels (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT NOT NULL,
    is_private BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE channel_members (
    channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
    user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
    joined_at  TIMESTAMPTZ DEFAULT NOW(),
    last_read  UUID,
    PRIMARY KEY (channel_id, user_id)
);

-- +goose Down

DROP TABLE IF EXISTS channel_members;
DROP TABLE IF EXISTS channels;