-- +goose Up

CREATE TABLE messages (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
    sender_id  UUID REFERENCES users(id),
    content    TEXT NOT NULL,
    parent_id  UUID REFERENCES messages(id),
    msg_type   TEXT DEFAULT 'text',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    edited_at  TIMESTAMPTZ
);

CREATE INDEX idx_messages_channel ON messages(channel_id, created_at DESC);
CREATE INDEX idx_messages_thread  ON messages(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_messages_fts     ON messages USING GIN(to_tsvector('english', content));

-- +goose Down

DROP TABLE IF EXISTS messages;