package security

import (
	"strings"
	"testing"
)

func TestBuildSignedMessage(t *testing.T) {
	msg := BuildSignedMessage("0xABCDEF", "1700000000")
	expected := "CreatorChain Authentication\nAddress:0xabcdef\nTimestamp:1700000000"
	if msg != expected {
		t.Fatalf("expected %q, got %q", expected, msg)
	}
}

func TestValidateSignedMessage(t *testing.T) {
	err := ValidateSignedMessage("0xABCDEF", "1700000000", "CreatorChain Authentication\nAddress:0xabcdef\nTimestamp:1700000000")
	if err != nil {
		t.Fatalf("should validate: %v", err)
	}

	err = ValidateSignedMessage("0xABCDEF", "1700000000", "wrong")
	if err == nil {
		t.Fatalf("expected mismatch error")
	}
}

func TestVerifySignatureFormat(t *testing.T) {
	dummySignature := "0x" + strings.Repeat("ab", 65)

	// Invalid address
	if err := VerifySignature("invalid", "msg", dummySignature); err == nil {
		t.Fatalf("expected invalid address error")
	}

	// Invalid signature format
	if err := VerifySignature("0x0000000000000000000000000000000000000000", "msg", "0x1234"); err == nil {
		t.Fatalf("expected format error")
	}
}
