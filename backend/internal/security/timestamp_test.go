package security

import (
	"strconv"
	"testing"
	"time"
)

func TestValidateTimestamp(t *testing.T) {
	now := time.Now().Unix()
	valid := time.Unix(now-60, 0).Unix()
	validStr := strconv.FormatInt(valid, 10)

	if _, err := ValidateTimestamp(validStr, 5*time.Minute); err != nil {
		t.Fatalf("expected valid timestamp: %v", err)
	}

	old := strconv.FormatInt(now-600, 10)
	if _, err := ValidateTimestamp(old, 5*time.Minute); err == nil {
		t.Fatalf("expected too old error")
	}

	future := strconv.FormatInt(now+600, 10)
	if _, err := ValidateTimestamp(future, 5*time.Minute); err == nil {
		t.Fatalf("expected future timestamp error")
	}
}

func TestTimestampGuard(t *testing.T) {
	guard := NewTimestampGuard()
	address := "0xabc"

	base := time.Now().Unix()

	if ok := guard.CheckAndStore(address, base); !ok {
		t.Fatalf("first timestamp should pass")
	}
	if ok := guard.CheckAndStore(address, base-1); ok {
		t.Fatalf("older timestamp within window should fail")
	}
	if ok := guard.CheckAndStore(address, base); ok {
		t.Fatalf("duplicate timestamp within window should fail")
	}
	if ok := guard.CheckAndStore(address, base+1); !ok {
		t.Fatalf("newer timestamp should pass")
	}
}
