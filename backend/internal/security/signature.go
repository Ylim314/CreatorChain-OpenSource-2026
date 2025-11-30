package security

import (
	"encoding/hex"
	"fmt"
	"strings"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
)

const signedMessagePrefix = "CreatorChain Authentication"

// BuildSignedMessage returns the canonical message users must sign.
func BuildSignedMessage(address string, timestamp string) string {
	normalized := strings.ToLower(address)
	return fmt.Sprintf("%s\nAddress:%s\nTimestamp:%s", signedMessagePrefix, normalized, timestamp)
}

// ValidateSignedMessage checks whether the provided message matches the
// canonical format for the given address and timestamp.
func ValidateSignedMessage(address string, timestamp string, message string) error {
	expected := BuildSignedMessage(address, timestamp)
	if strings.TrimSpace(message) != expected {
		return fmt.Errorf("signed message mismatch")
	}
	return nil
}

// VerifySignature checks whether the signature was produced by the address for
// the given message.
// MetaMask's signMessage automatically adds the Ethereum message prefix:
// "\x19Ethereum Signed Message:\n<length><message>"
func VerifySignature(address string, message string, signature string) error {
	if !common.IsHexAddress(address) {
		return fmt.Errorf("invalid ethereum address")
	}

	if !strings.HasPrefix(signature, "0x") || len(signature) != 132 {
		return fmt.Errorf("invalid signature format: expected 132 chars with 0x prefix, got %d", len(signature))
	}

	sigBytes, err := hex.DecodeString(signature[2:])
	if err != nil {
		return fmt.Errorf("failed to decode signature: %w", err)
	}
	if len(sigBytes) != 65 {
		return fmt.Errorf("invalid signature length: expected 65 bytes, got %d", len(sigBytes))
	}

	// MetaMask's signMessage uses personal_sign which adds the Ethereum message prefix
	// Format: "\x19Ethereum Signed Message:\n<length><message>"
	messageBytes := []byte(message)
	prefix := fmt.Sprintf("\x19Ethereum Signed Message:\n%d", len(messageBytes))
	prefixedMessage := append([]byte(prefix), messageBytes...)
	
	// Calculate the hash that MetaMask would have signed
	messageHash := crypto.Keccak256Hash(prefixedMessage)
	
	// Adjust V value if needed (MetaMask uses 27/28, but go-ethereum expects 0/1)
	adjustedSigBytes := make([]byte, 65)
	copy(adjustedSigBytes, sigBytes)
	if adjustedSigBytes[64] >= 27 {
		adjustedSigBytes[64] -= 27
	}
	
	pubKey, err := crypto.SigToPub(messageHash.Bytes(), adjustedSigBytes)
	if err != nil {
		return fmt.Errorf("signature recovery failed: %w", err)
	}

	recoveredAddr := crypto.PubkeyToAddress(*pubKey)
	expectedAddr := common.HexToAddress(address)
	if !strings.EqualFold(recoveredAddr.Hex(), expectedAddr.Hex()) {
		return fmt.Errorf("signature does not match address: recovered %s, expected %s", recoveredAddr.Hex(), expectedAddr.Hex())
	}

	return nil
}
