-- name: CreateWorkspace :one
INSERT INTO workspaces (name, slug, is_private , created_by)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: AddWorkspaceMember :exec
INSERT INTO workspace_members (workspace_id, user_id, role)
VALUES ($1, $2, $3)
ON CONFLICT (workspace_id, user_id) DO NOTHING;

-- name: IsWorkspaceMember :one
SELECT EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = $1 AND user_id = $2
) AS is_member;

-- name: GetWorkspacesByUser :many
SELECT w.* FROM workspaces w
INNER JOIN workspace_members wm ON wm.workspace_id = w.id
WHERE wm.user_id = $1
ORDER BY w.created_at ASC;

-- name: GetWorkspaceByID :one
SELECT * FROM workspaces WHERE id = $1 LIMIT 1;

-- name: GetWorkspaceMembers :many
SELECT u.id,u.username,u.email,u.avatar_url,ws.role
FROM workspace_members ws
JOIN users u ON u.id = ws.user_id
where ws.workspace_id = $1; 

-- name: SearchWorkspaces :many
SELECT *
FROM workspaces
WHERE
    (
        sqlc.arg(search)::text = ''
        OR name ILIKE '%' || sqlc.arg(search)::text || '%'
        OR slug ILIKE '%' || sqlc.arg(search)::text || '%'
    )
    AND (
        sqlc.arg(created_by)::uuid IS NULL
        OR created_by = sqlc.arg(created_by)::uuid
    )
    AND (
        sqlc.arg(created_after)::timestamptz IS NULL
        OR created_at >= sqlc.arg(created_after)::timestamptz
    )
    AND (
        sqlc.arg(created_before)::timestamptz IS NULL
        OR created_at < sqlc.arg(created_before)::timestamptz
    )
ORDER BY created_at DESC
LIMIT sqlc.arg(page_limit)::int
OFFSET sqlc.arg(page_offset)::int;

-- name: EditWorkspace :one
UPDATE workspaces
set name = $1, slug = $2, is_private = $3
where id = $4 and created_by = $5
returning *;

-- name: DeleteWorkspace :exec
DELETE From workspaces
WHERE id = $1 and created_by = $2;


-- name: GenerateWorkspaceInvite :one
UPDATE workspaces
set 
    invite_code = $1,
    invite_expires_at = $2
where 
    id = $3
    and created_by = $4
returning invite_code, invite_expires_at;

-- name: GetWorkspaceByInviteCode :one
SELECT * From
    workspaces
WHERE 
    invite_code = $1
    AND
    (
      invite_expires_at IS NULL
      OR invite_expires_at > NOW()
  );


-- name: GetWorkspaceBySlug :one
SELECT * FROM workspaces WHERE slug = $1 LIMIT 1;