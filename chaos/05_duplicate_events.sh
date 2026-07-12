#!/bin/bash
SESSION_RES=$(curl -s -X POST http://localhost:5259/api/v1/analysis-sessions -H "Content-Type: application/json" -d '{"caseId": "test-case"}')
SESSION_ID=$(echo $SESSION_RES | jq -r .data.sessionId)
curl -s -X POST http://localhost:5259/api/v1/analysis-sessions/$SESSION_ID/events -H "Content-Type: application/json" -d '{"proceedingId":"52b8e01d-93a9-4a91-b824-34c21d571f7b","caseId":"test-case","type":"FIL","date":"2026-07-04T10:00:00Z"}'
curl -i -X POST http://localhost:5259/api/v1/analysis-sessions/$SESSION_ID/events -H "Content-Type: application/json" -d '{"proceedingId":"52b8e01d-93a9-4a91-b824-34c21d571f7b","caseId":"test-case","type":"FIL","date":"2026-07-04T10:00:00Z"}'
