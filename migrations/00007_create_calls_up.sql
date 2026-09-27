-- +goose Up
CREATE TABLE calls (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id    UUID REFERENCES channels(id),
    dm_id         UUID REFERENCES direct_messages(id),
    -- if call was started inside a thread
    thread_msg_id UUID REFERENCES messages(id),
    started_by    UUID REFERENCES users(id),
    -- 'active' | 'ended'
    status        TEXT NOT NULL DEFAULT 'active',
    started_at    TIMESTAMPTZ DEFAULT NOW(),
    ended_at      TIMESTAMPTZ,
    duration_sec  INT,

    CONSTRAINT call_belongs_to_one CHECK (
        (channel_id IS NOT NULL AND dm_id IS NULL) OR
        (channel_id IS NULL     AND dm_id IS NOT NULL)
    )
);

CREATE TABLE call_participants (
    call_id   UUID REFERENCES calls(id) ON DELETE CASCADE,
    user_id   UUID REFERENCES users(id),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at   TIMESTAMPTZ,
    PRIMARY KEY (call_id, user_id)
);

CREATE TABLE call_summaries (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id    UUID REFERENCES calls(id) UNIQUE,
    transcript TEXT,
    summary    TEXT,
    -- the message posted in channel after call ends
    msg_id     UUID REFERENCES messages(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Now that calls table exists, add the FK on messages.call_id
ALTER TABLE messages
    ADD CONSTRAINT fk_messages_call
    FOREIGN KEY (call_id) REFERENCES calls(id);

CREATE INDEX idx_calls_channel ON calls(channel_id) WHERE channel_id IS NOT NULL;
CREATE INDEX idx_calls_active  ON calls(status) WHERE status = 'active';

-- +goose Down
ALTER TABLE messages DROP CONSTRAINT IF EXISTS fk_messages_call;
DROP TABLE IF EXISTS call_summaries CASCADE;
DROP TABLE IF EXISTS call_participants CASCADE;
DROP TABLE IF EXISTS calls CASCADE;