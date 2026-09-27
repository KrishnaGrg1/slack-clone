-- +goose Up

-- A DM conversation between 2+ users within a workspace
CREATE TABLE direct_messages (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE direct_message_members (
    dm_id      UUID REFERENCES direct_messages(id) ON DELETE CASCADE,
    user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
    joined_at  TIMESTAMPTZ DEFAULT NOW(),
    last_read_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (dm_id, user_id)
);

-- +goose Down
DROP TABLE IF EXISTS direct_message_members CASCADE;
DROP TABLE IF EXISTS direct_messages CASCADE;