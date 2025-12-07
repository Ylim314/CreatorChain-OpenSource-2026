package service

import (
	"crypto/ecdsa"
	"encoding/hex"
	"fmt"
	"strconv"
	"testing"
	"time"

	"creatorchain-backend/internal/repository"
	"creatorchain-backend/internal/security"

	"github.com/ethereum/go-ethereum/crypto"
)

type mockUserRepo struct{}

func (m *mockUserRepo) FindByAddress(address string) (*repository.User, error) {
	return &repository.User{Address: address}, nil
}

func (m *mockUserRepo) GetByAddress(address string) (*repository.User, error) {
	return m.FindByAddress(address)
}

func (m *mockUserRepo) Create(user *repository.User) error {
	return nil
}

func (m *mockUserRepo) Update(user *repository.User) error {
	return nil
}

func (m *mockUserRepo) IsFavorite(userID uint, creationID uint) bool {
	return false
}

func (m *mockUserRepo) ToggleFavorite(userID uint, creationID uint) (bool, error) {
	return false, nil
}

func (m *mockUserRepo) GetFavorites(userID uint) ([]repository.Creation, error) {
	return nil, nil
}

func (m *mockUserRepo) TransferPoints(fromAddress, toAddress string, amount int64) error {
	return nil
}

func (m *mockUserRepo) AddPoints(address string, amount int64) error {
	return nil
}

func setupUserService(t *testing.T) UserService {
	t.Helper()
	t.Setenv("JWT_SECRET", "test-secret")
	loginTimestampGuard = security.NewTimestampGuard()
	return NewUserService(&mockUserRepo{}, nil)
}

func buildSignedPayload(t *testing.T, privKey *ecdsa.PrivateKey, timestamp string) (address, message, signature string) {
	t.Helper()
	address = crypto.PubkeyToAddress(privKey.PublicKey).Hex()
	message = security.BuildSignedMessage(address, timestamp)

	msgBytes := []byte(message)
	prefix := fmt.Sprintf("\x19Ethereum Signed Message:\n%d", len(msgBytes))
	prefixed := append([]byte(prefix), msgBytes...)

	hash := crypto.Keccak256Hash(prefixed)
	sigBytes, err := crypto.Sign(hash.Bytes(), privKey)
	if err != nil {
		t.Fatalf("sign failed: %v", err)
	}
	signature = "0x" + hex.EncodeToString(sigBytes)
	return
}

func TestAuthenticateUserSuccess(t *testing.T) {
	service := setupUserService(t)
	privKey, err := crypto.GenerateKey()
	if err != nil {
		t.Fatalf("generate key failed: %v", err)
	}

	timestamp := strconv.FormatInt(time.Now().Unix(), 10)
	address, message, signature := buildSignedPayload(t, privKey, timestamp)

	token, err := service.AuthenticateUser(address, message, signature, timestamp)
	if err != nil {
		t.Fatalf("expected success, got error: %v", err)
	}
	if token == "" {
		t.Fatalf("expected token, got empty string")
	}
}

func TestAuthenticateUserRejectsOldTimestamp(t *testing.T) {
	service := setupUserService(t)
	privKey, err := crypto.GenerateKey()
	if err != nil {
		t.Fatalf("generate key failed: %v", err)
	}

	oldTimestamp := strconv.FormatInt(time.Now().Add(-10*time.Minute).Unix(), 10)
	address, message, signature := buildSignedPayload(t, privKey, oldTimestamp)

	if _, err := service.AuthenticateUser(address, message, signature, oldTimestamp); err == nil {
		t.Fatalf("expected error for old timestamp")
	}
}

func TestAuthenticateUserDetectsReplay(t *testing.T) {
	service := setupUserService(t)
	privKey, err := crypto.GenerateKey()
	if err != nil {
		t.Fatalf("generate key failed: %v", err)
	}

	timestamp := strconv.FormatInt(time.Now().Unix(), 10)
	address, message, signature := buildSignedPayload(t, privKey, timestamp)

	if _, err := service.AuthenticateUser(address, message, signature, timestamp); err != nil {
		t.Fatalf("first call should succeed: %v", err)
	}

	if _, err := service.AuthenticateUser(address, message, signature, timestamp); err == nil {
		t.Fatalf("expected replay detection error")
	}
}
