
-- name: CreateChannel :one
INSERT INTO channels(name,channel_type,created_by,workspace_id)
VALUES ($1,$2,$3,$4)
RETURNING *;

-- name: GetChannelById :one
SELECT * FROM channels
WHERE id = $1 
LIMIT 1;

-- name: GetChannels :many
SELECT * FROM channels
WHERE is_private = false;

-- name: JoinChannel :exec
INSERT INTO channel_members(channel_id,user_id)
VALUES ($1,$2)
ON CONFLICT (channel_id, user_id) DO NOTHING;

-- name: LeaveChannel :exec
DELETE FROM channel_members
WHERE channel_id = $1 AND user_id = $2;

-- name: GetChannelMembers :many
SELECT u.id, u.username, u.email, u.avatar_url
FROM channel_members cm
JOIN users u ON u.id = cm.user_id
WHERE cm.channel_id = $1;


-- name: IsChannelMember :one
SELECT EXISTS (
    SELECT 1
    FROM channel_members
    WHERE channel_id = $1
      AND user_id = $2
);


-- name: GetChannelsByWorkspace :many
SELECT c.* FROM channels c
WHERE c.workspace_id = $1
AND (
    c.channel_type = 'public'
    OR EXISTS (
        SELECT 1 FROM channel_members cm
        WHERE cm.channel_id = c.id AND cm.user_id = $2
    )
)
ORDER BY c.created_at ASC;