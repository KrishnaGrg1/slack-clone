
-- name: CreateChannel :one
INSERT INTO channels(name,is_private,created_by)
VALUES ($1,$2,$3)
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