#!/bin/bash
SESSION_RES=$(curl -s -X POST http://localhost:5259/api/v1/analysis-sessions -H "Content-Type: application/json" -d '{"caseId": "test-case"}')
SESSION_ID=$(echo $SESSION_RES | jq -r .data.sessionId)
echo "Created session: $SESSION_ID"
curl -s -X POST http://localhost:5259/api/v1/analysis-sessions/$SESSION_ID/events -H "Content-Type: application/json" -d '{"proceedingId":"b29d64d6-7a3c-4e1b-980b-47f95d1e5274","caseId":"test-case","type":"FIL","date":"2026-07-04T10:00:00Z"}'
curl -s -X POST http://localhost:5259/api/v1/analysis-sessions/$SESSION_ID/analyze
curl -s http://localhost:5259/api/v1/analysis-sessions/$SESSION_ID/result | jq .
