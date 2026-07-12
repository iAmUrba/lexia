#!/bin/bash
SESSION_RES=$(curl -s -X POST http://localhost:5259/api/v1/analysis-sessions -H "Content-Type: application/json" -d '{"caseId": "test-case"}')
SESSION_ID=$(echo $SESSION_RES | jq -r .data.sessionId)
echo "First analyze..."
curl -i -X POST http://localhost:5259/api/v1/analysis-sessions/$SESSION_ID/analyze
echo "Second analyze..."
curl -i -X POST http://localhost:5259/api/v1/analysis-sessions/$SESSION_ID/analyze
