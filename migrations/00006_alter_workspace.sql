-- +goose Up
Alter table workspaces
add is_private boolean;

-- +goose Down

