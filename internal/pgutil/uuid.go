package pgutil

import (
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

func ParseToPGUUID(value string) (pgtype.UUID, error) {
	parsedUUID, err := uuid.Parse(value)
	if err != nil {
		return pgtype.UUID{}, err
	}

	return pgtype.UUID{
		Bytes: [16]byte(parsedUUID),
		Valid: true,
	}, nil
}
