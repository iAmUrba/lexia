#!/bin/bash
SESSION_RES=$(curl -s -X POST http://localhost:5259/api/v1/analysis-sessions -H "Content-Type: application/json" -d '{"caseId": "test-case"}')
SESSION_ID=$(echo $SESSION_RES | jq -r .data.sessionId)
curl -s -X POST http://localhost:5259/api/v1/analysis-sessions/$SESSION_ID/analyze
curl -i -X POST http://localhost:5259/api/v1/analysis-sessions/$SESSION_ID/events -H "Content-Type: application/json" -d '{"proceedingId":"1f70394a-8591-4421-a1a2-b1def56fd0bb","caseId":"test-case","type":"FIL","date":"2026-07-04T10:00:00Z"}'
