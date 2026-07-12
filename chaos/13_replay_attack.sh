#!/bin/bash
SESSION_RES=$(curl -s -X POST http://localhost:5259/api/v1/analysis-sessions -H "Content-Type: application/json" -d '{"caseId": "test-case"}')
SESSION_ID=$(echo $SESSION_RES | jq -r .data.sessionId)
EVENT='{"proceedingId":"test-case-replay","caseId":"test-case","type":"FIL","date":"2026-07-04T10:00:00Z"}'
curl -s -X POST http://localhost:5259/api/v1/analysis-sessions/$SESSION_ID/events -H "Content-Type: application/json" -d "$EVENT"
curl -s -X POST http://localhost:5259/api/v1/analysis-sessions/$SESSION_ID/events -H "Content-Type: application/json" -d "$EVENT"
curl -s -X POST http://localhost:5259/api/v1/analysis-sessions/$SESSION_ID/events -H "Content-Type: application/json" -d "$EVENT"
curl -s http://localhost:5259/api/v1/analysis-sessions/$SESSION_ID
