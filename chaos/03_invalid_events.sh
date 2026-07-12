#!/bin/bash
SESSION_RES=$(curl -s -X POST http://localhost:5259/api/v1/analysis-sessions -H "Content-Type: application/json" -d '{"caseId": "test-case"}')
SESSION_ID=$(echo $SESSION_RES | jq -r .data.sessionId)
curl -i -X POST http://localhost:5259/api/v1/analysis-sessions/$SESSION_ID/events -H "Content-Type: application/json" -d '{"invalid_format": true}'
