-- name: CreateCall :one
INSERT INTO calls (id, channel_id, started_by)
VALUES ($1, $2, $3)
RETURNING *;

-- name: CreateCallParticipants :one
INSERT INTO call_participants(call_id,user_id)
VALUES ($1,$2)
RETURNING *;

-- name: CreateCallSummaries :one
INSERT INTO call_summaries(call_id,transcript,summary)
VALUES ($1,$2,$3)
RETURNING *;

-- name: AddCallParticipant :exec
INSERT INTO call_participants (call_id, user_id)
VALUES ($1, $2)
ON CONFLICT (call_id, user_id) DO UPDATE SET left_at = NULL;

-- name: GetCallByID :one
SELECT
	id,
	channel_id,
	dm_id,
	thread_msg_id,
	started_by,
	status,
	started_at,
	ended_at,
	duration_sec
FROM calls
WHERE id = $1
LIMIT 1;


-- name: MarkCallParticipantLeft :exec
UPDATE call_participants
SET left_at = NOW()
WHERE call_id = $1 AND user_id = $2 AND left_at IS NULL;


-- name: EndCall :exec
UPDATE calls
SET status       = 'ended',
    ended_at     = NOW(),
    duration_sec = EXTRACT(EPOCH FROM (NOW() - started_at))::int
WHERE id = $1 AND status = 'active';


-- name: CanUploadRecording :one
-- the caller must have been in this call, and it must belong to this channel
SELECT EXISTS (
    SELECT 1
    FROM calls c
    JOIN call_participants p ON p.call_id = c.id
    WHERE c.id = $1 AND c.channel_id = $2 AND p.user_id = $3
);

-- name: CloseStaleParticipants :exec
UPDATE call_participants SET left_at = NOW()
WHERE left_at IS NULL
  AND call_id IN (SELECT id FROM calls WHERE status = 'active');

-- name: CloseStaleCalls :exec
UPDATE calls
SET status = 'ended', ended_at = NOW(),
    duration_sec = EXTRACT(EPOCH FROM (NOW() - started_at))::int
WHERE status = 'active';