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
func VerifySignature(address string, message string, signature string) error {
	if !common.IsHexAddress(address) {
		return fmt.Errorf("invalid ethereum address")
	}

	if !strings.HasPrefix(signature, "0x") || len(signature) != 132 {
		return fmt.Errorf("invalid signature format")
	}

	sigBytes, err := hex.DecodeString(signature[2:])
	if err != nil {
		return fmt.Errorf("failed to decode signature: %w", err)
	}
	if len(sigBytes) != 65 {
		return fmt.Errorf("invalid signature length")
	}

	messageHash := crypto.Keccak256Hash([]byte(message))
	pubKey, err := crypto.SigToPub(messageHash.Bytes(), sigBytes)
	if err != nil {
		return fmt.Errorf("signature recovery failed: %w", err)
	}

	recoveredAddr := crypto.PubkeyToAddress(*pubKey)
	expectedAddr := common.HexToAddress(address)
	if !strings.EqualFold(recoveredAddr.Hex(), expectedAddr.Hex()) {
		return fmt.Errorf("signature does not match address")
	}

	return nil
}
