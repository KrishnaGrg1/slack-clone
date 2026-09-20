-- name: CreateWorkspace :one
INSERT INTO workspaces (name, slug, created_by)
VALUES ($1, $2, $3)
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
SELECT u.id,u.username,u.email,u.avatar_url
FROM workspace_members ws
JOIN users u ON u.id = ws.user_id
where ws.workspace_id = $1; 