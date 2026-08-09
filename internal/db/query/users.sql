
-- name: CreateUser :one
INSERT INTO USERS (username,email,password)
VALUES ($1,$2,$3)
RETURNING *;

-- name: GetUserByEmail :one
SELECT * FROM USERS
WHERE email = $1 LIMIT 1;

-- name: GetUserByUserId :one
SELECT * FROM USERS
WHERE id = $1 LIMIT 1;
