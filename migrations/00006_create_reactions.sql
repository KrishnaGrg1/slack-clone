-- +goose Up
CREATE TABLE reactions (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
    emoji      TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- one reaction per emoji per user per message
    UNIQUE (message_id, user_id, emoji)
);

CREATE INDEX idx_reactions_message ON reactions(message_id);

-- +goose Down
DROP TABLE IF EXISTS reactions CASCADE;