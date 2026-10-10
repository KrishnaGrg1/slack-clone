package storage

import (
	"context"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"

	"github.com/google/uuid"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

type StorageService struct {
	client     *minio.Client
	bucketName string
}

func NewMinIOStorage(minioURl, minioAcessKey, minioSecretAccessKey string) (*StorageService, error) {
	endpoint := minioURl
	accessKeyID := minioAcessKey
	secretAccessKey := minioSecretAccessKey
	useSSL := false // Set false for local HTTP testing

	// Initialize MinIO client
	minioClient, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKeyID, secretAccessKey, ""),
		Secure: useSSL,
		Region: "us-east-1",
	})
	if err != nil {
		return nil, fmt.Errorf("failed to init minio: %w", err)
	}

	bucketName := "huddle-recordings"
	ctx := context.Background()

	// Automatically ensure bucket exists on startup
	exists, errBucketExists := minioClient.BucketExists(ctx, bucketName)
	if errBucketExists == nil && !exists {
		err = minioClient.MakeBucket(ctx, bucketName, minio.MakeBucketOptions{Region: "us-east-1"})
		if err != nil {
			return nil, fmt.Errorf("failed to create bucket: %w", err)
		}
		log.Printf("Successfully created bucket: %s", bucketName)
	}

	return &StorageService{
		client:     minioClient,
		bucketName: bucketName,
	}, nil
}

// Uploads a local file to MinIO
func (s *StorageService) UploadAudioStream(ctx context.Context, objectName string, reader io.Reader, size int64, contentType string) error {
	if contentType == "" {
		contentType = "audio/wav"
	}

	info, err := s.client.PutObject(ctx, s.bucketName, objectName, reader, size, minio.PutObjectOptions{
		ContentType: contentType,
	})

	if err != nil {
		return fmt.Errorf("failed to upload audio object: %w", err)
	}

	log.Printf("Successfully uploaded %s (%d bytes) to MinIO", objectName, info.Size)
	return nil
}

// download from MinIO

func (s *StorageService) DownloadToTemp(ctx context.Context, objectName string) (string, error) {
	ext := filepath.Ext(objectName)
	if ext == "" {
		ext = ".webm"
	}
	tmpPath := filepath.Join(os.TempDir(), uuid.New().String()+ext)

	err := s.client.FGetObject(ctx, s.bucketName, objectName, tmpPath, minio.GetObjectOptions{})
	if err != nil {
		return "", fmt.Errorf("download from minio: %w", err)
	}

	return tmpPath, nil
}
