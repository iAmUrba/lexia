#!/bin/bash
SESSION_RES=$(curl -s -X POST http://localhost:5259/api/v1/analysis-sessions -H "Content-Type: application/json" -d '{"caseId": "test-case"}')
SESSION_ID=$(echo $SESSION_RES | jq -r .data.sessionId)
curl -i -X POST http://localhost:5259/api/v1/analysis-sessions/$SESSION_ID/events -H "Content-Type: application/json" -d '{"proceedingId":"977bd9b5-0e20-4be4-8b17-c2b20c8d94be","caseId":"test-case","type":"FIL","date":"invalid-date"}}'
