package handler

import (
	"net/http"
	"time"

	db "github.com/KrishnaGrg1/slack-clone/internal/db/sqlc"
	"github.com/KrishnaGrg1/slack-clone/internal/response"
	"github.com/KrishnaGrg1/slack-clone/internal/store"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	store     *store.Store
	jwtSecret string
}

func NewAuthHandler(s *store.Store, jwtSecret string) *AuthHandler {
	return &AuthHandler{
		store:     s,
		jwtSecret: jwtSecret,
	}
}

type registerRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type authUserResponse struct {
	ID       string `json:"id"`
	Username string `json:"username"`
	Email    string `json:"email"`
	Avatar   string `json:"avatar,omitempty"`
}

type authResponse struct {
	Token string           `json:"token"`
	User  authUserResponse `json:"user"`
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req registerRequest
	if err := response.Read(r, &req); err != nil {
		response.BadRequest(w, "VALIDATION_001", "invalid request body", "request body must be valid JSON")
		return
	}
	if req.Email == "" || req.Password == "" {
		response.BadRequest(w, "VALIDATION_002", "email and password are required", "email and password are required")
		return
	}
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), 12)
	if err != nil {
		response.InternalServerError(w, "VALIDATION_003", "failed to hash password", "failed to hash password")
		return
	}
	newUser, err := h.store.Queries.CreateUser(r.Context(), db.CreateUserParams{
		Username: req.Username,
		Password: string(hashedPassword),
		Email:    req.Email,
	})
	if err != nil {
		response.Conflict(w, "VALIDATION_004", "registration failed", "username or email already exists")
		return
	}
	token, err := h.generateJWT(newUser.ID.String(), newUser.Username)
	if err != nil {
		response.InternalServerError(w, "VALIDATION_005", "failed to generate token", "token creation failed")
		return
	}
	secure := r.TLS != nil
	http.SetCookie(w, &http.Cookie{
		Name:     "token",
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   int((7 * 24 * time.Hour).Seconds()),
	})
	response.Created(w, "registration successful", authResponse{
		Token: token,
		User: authUserResponse{
			ID:       newUser.ID.String(),
			Username: newUser.Username,
			Email:    newUser.Email,
		},
	})

}

type LoginInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginInput
	if err := response.Read(r, &req); err != nil {
		response.BadRequest(w, "VALIDATION_001", "invalid request body", "request body must be valid JSON")
		return
	}
	existingUser, err := h.store.Queries.GetUserByEmail(r.Context(), req.Email)
	if err != nil {
		response.Unauthorized(w, "AUTH_001", "invalid credentials", "invalid email or password")
		return
	}
	if err = bcrypt.CompareHashAndPassword([]byte(existingUser.Password), []byte(req.Password)); err != nil {
		response.Unauthorized(w, "AUTH_001", "invalid credentials", "invalid email or password")
		return
	}
	token, err := h.generateJWT(existingUser.ID.String(), existingUser.Username)
	if err != nil {
		response.InternalServerError(w, "AUTH_002", "failed to generate token", "token creation failed")
		return
	}
	secure := r.TLS != nil
	http.SetCookie(w, &http.Cookie{
		Name:     "token",
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   int((7 * 24 * time.Hour).Seconds()),
	})
	response.Success(w, http.StatusOK, "login successful", authResponse{
		Token: token,
		User: authUserResponse{
			ID:       existingUser.ID.String(),
			Username: existingUser.Username,
			Email:    existingUser.Email,
		},
	})
}

func (h *AuthHandler) generateJWT(userID string, userName string) (string, error) {
	claims := jwt.MapClaims{
		"sub":      userID,
		"userName": userName,
		"exp":      time.Now().Add(7 * 24 * time.Hour).Unix(),
		"iat":      time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(h.jwtSecret))
}
