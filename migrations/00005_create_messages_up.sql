-- +goose Up
CREATE TABLE messages (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- belongs to either a channel OR a DM, never both
    channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
    dm_id      UUID REFERENCES direct_messages(id) ON DELETE CASCADE,
    sender_id  UUID REFERENCES users(id),
    content    TEXT NOT NULL,
    -- NULL = top-level message, set = thread reply
    thread_id  UUID REFERENCES messages(id),
    -- 'text' | 'call' | 'call_summary'
    msg_type   TEXT NOT NULL DEFAULT 'text',
    -- links call-type messages back to the call row
    call_id    UUID, -- FK added after calls table in migration 007
    created_at TIMESTAMPTZ DEFAULT NOW(),
    edited_at  TIMESTAMPTZ,

    CONSTRAINT message_belongs_to_one CHECK (
        (channel_id IS NOT NULL AND dm_id IS NULL) OR
        (channel_id IS NULL     AND dm_id IS NOT NULL)
    )
);

-- fetch channel messages in order
CREATE INDEX idx_messages_channel ON messages(channel_id, created_at DESC);
-- fetch DM messages in order
CREATE INDEX idx_messages_dm      ON messages(dm_id, created_at DESC);
-- fetch all replies for a thread
CREATE INDEX idx_messages_thread  ON messages(thread_id) WHERE thread_id IS NOT NULL;
-- full-text search
CREATE INDEX idx_messages_fts     ON messages USING GIN(to_tsvector('english', content));

-- +goose Down
DROP TABLE IF EXISTS messages CASCADE;