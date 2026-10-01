-- name: CreateCall :one
INSERT INTO calls(channel_id)
VALUES ($1)
RETURNING *;

-- name: CreateCallParticipants :one
INSERT INTO call_participants(call_id,user_id)
VALUES ($1,$2)
RETURNING *;

-- name: CreateCallSummaries :one
INSERT INTO call_summaries(call_id,transcript,summary)
VALUES ($1,$2,$3)
RETURNING *;