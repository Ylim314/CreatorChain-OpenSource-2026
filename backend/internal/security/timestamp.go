package security

import (
	"fmt"
	"strconv"
	"strings"
	"sync"
	"time"
)

// ValidateTimestamp parses and validates the timestamp string using the given
// window. It ensures the timestamp is not in the future and not older than
// the allowed window.
func ValidateTimestamp(timestampStr string, window time.Duration) (int64, error) {
	ts, err := strconv.ParseInt(timestampStr, 10, 64)
	if err != nil {
		return 0, fmt.Errorf("invalid timestamp")
	}

	now := time.Now().Unix()
	if ts > now {
		return 0, fmt.Errorf("timestamp from the future")
	}

	if now-ts > int64(window.Seconds()) {
		return 0, fmt.Errorf("timestamp too old")
	}

	return ts, nil
}

// TimestampGuard tracks the newest timestamp per address to prevent replay
// attacks with duplicate payloads.
type TimestampGuard struct {
	mu     sync.Mutex
	latest map[string]int64
}

// NewTimestampGuard returns a TimestampGuard.
func NewTimestampGuard() *TimestampGuard {
	return &TimestampGuard{
		latest: make(map[string]int64),
	}
}

// CheckAndStore ensures the incoming timestamp is strictly newer than the last
// accepted value for the address. Returns false if the timestamp is reused or
// older.
// For login, we allow re-authentication within a reasonable time window (5 minutes)
// to handle cases where users reconnect their wallet.
func (g *TimestampGuard) CheckAndStore(address string, timestamp int64) bool {
	g.mu.Lock()
	defer g.mu.Unlock()

	key := strings.ToLower(address)
	now := time.Now().Unix()
	
	if last, ok := g.latest[key]; ok {
		// 如果时间戳相同或更早
		if timestamp <= last {
			// 检查是否在5分钟的时间窗口内
			timeSinceLastLogin := now - last
			// 如果超过5分钟，清除旧记录，允许重新登录
			if timeSinceLastLogin > 300 {
				g.latest[key] = timestamp
				return true
			}
			// 如果在5分钟内且时间戳相同或更早，拒绝（可能是重放攻击）
			return false
		}
	}

	// 时间戳更新，允许
	g.latest[key] = timestamp
	return true
}

// GetLastTimestamp returns the last used timestamp for an address
func (g *TimestampGuard) GetLastTimestamp(address string) int64 {
	g.mu.Lock()
	defer g.mu.Unlock()

	key := strings.ToLower(address)
	if last, ok := g.latest[key]; ok {
		return last
	}
	return 0
}
