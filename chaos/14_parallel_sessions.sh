#!/bin/bash
for i in {1..20}; do
  (
    SESSION_RES=$(curl -s -X POST http://localhost:5259/api/v1/analysis-sessions -H "Content-Type: application/json" -d '{"caseId": "test-case-'$i'"}')
    SESSION_ID=$(echo $SESSION_RES | jq -r .data.sessionId)
    curl -s -X POST http://localhost:5259/api/v1/analysis-sessions/$SESSION_ID/events -H "Content-Type: application/json" -d '{"proceedingId":"test-case-'$i'","caseId":"test-case-'$i'","type":"FIL","date":"2026-07-04T10:00:00Z"}'
    curl -s -X POST http://localhost:5259/api/v1/analysis-sessions/$SESSION_ID/analyze
  ) &
done
wait
echo "20 parallel sessions processed."
