-- +goose Up
CREATE TABLE calls (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id    UUID REFERENCES channels(id),
    thread_msg_id UUID REFERENCES messages(id),
    started_by    UUID REFERENCES users(id),
    started_at    TIMESTAMPTZ DEFAULT NOW(),
    ended_at      TIMESTAMPTZ,
    duration_sec  INT
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
    msg_id     UUID REFERENCES messages(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- +goose Down
DROP TABLE IF EXISTS call_summaries CASCADE;
DROP TABLE IF EXISTS call_participants CASCADE;
DROP TABLE IF EXISTS calls CASCADE;
