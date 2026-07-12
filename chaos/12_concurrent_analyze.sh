#!/bin/bash
SESSION_RES=$(curl -s -X POST http://localhost:5259/api/v1/analysis-sessions -H "Content-Type: application/json" -d '{"caseId": "test-case"}')
SESSION_ID=$(echo $SESSION_RES | jq -r .data.sessionId)
# Run in background to simulate concurrency
curl -i -s -X POST http://localhost:5259/api/v1/analysis-sessions/$SESSION_ID/analyze &
curl -i -s -X POST http://localhost:5259/api/v1/analysis-sessions/$SESSION_ID/analyze &
wait
