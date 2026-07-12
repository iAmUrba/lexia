#!/bin/bash
SESSION_RES=$(curl -s -X POST http://localhost:5259/api/v1/analysis-sessions -H "Content-Type: application/json" -d '{"caseId": "test-case"}')
SESSION_ID=$(echo $SESSION_RES | jq -r .data.sessionId)
# Create a big string
BIG_STR=$(printf 'A%.0s' {1..50000})
curl -i -X POST http://localhost:5259/api/v1/analysis-sessions/$SESSION_ID/events -H "Content-Type: application/json" -d "{\"proceedingId\":\"$BIG_STR\",\"caseId\":\"test-case\",\"type\":\"FIL\",\"date\":{\"value\":\"2026-07-04T10:00:00Z\"}}"
