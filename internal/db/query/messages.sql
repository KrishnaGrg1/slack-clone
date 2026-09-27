-- name: CreateMessage :one
INSERT INTO messages(channel_id,sender_id,content,thread_id,msg_type)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetChannelMessages :many
SELECT
    m.id,
    m.channel_id,
    m.sender_id,
    m.content,
    m.thread_id,
    m.msg_type,
    m.created_at,
    m.edited_at,
    u.username AS sender_username,
    u.avatar_url AS sender_avatar
FROM messages m
JOIN users u ON u.id = m.sender_id
WHERE m.channel_id = $1
AND m.thread_id IS NULL
AND ($2::timestamptz IS NULL OR m.created_at < $2)
ORDER BY m.created_at DESC
LIMIT $3;

-- name: GetThreadMessages :many
SELECT
    m.id,
    m.channel_id,
    m.sender_id,
    m.content,
    m.thread_id,
    m.msg_type,
    m.created_at,
    m.edited_at,
    u.username AS sender_username,
    u.avatar_url AS sender_avatar 
FROM messages m
JOIN users u ON u.id = m.sender_id
WHERE m.thread_id = $1
ORDER BY m.created_at ASC;

-- name: GetMessageByID :one
SELECT * from messages WHERE id = $1 LIMIT 1;

-- name: EditMessage :one
UPDATE messages
SET content = $2, edited_at = NOW()
WHERE id = $1 AND sender_id = $3
RETURNING *;

-- name: DeleteMessage :exec
DELETE FROM messages
WHERE id = $1 AND sender_id = $2;
