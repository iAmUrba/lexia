import os
import glob
import uuid

for filepath in glob.glob("chaos/*.sh"):
    with open(filepath, "r") as f:
        content = f.read()

    # 1. Update jq selector
    content = content.replace("jq -r .sessionId", "jq -r .data.sessionId")

    # 2. Update date payload
    content = content.replace('"date":{"value":', '"date":')
    content = content.replace('Z"}}', 'Z"}')

    # 3. Update proceedingId to be a valid GUID instead of "test-case"
    # Some scripts use "test-case" for both caseId and proceedingId, but proceedingId must be a guid now.
    # We can just replace '"proceedingId":"test-case"' with a valid GUID
    guid = str(uuid.uuid4())
    content = content.replace('"proceedingId":"test-case"', f'"proceedingId":"{guid}"')

    with open(filepath, "w") as f:
        f.write(content)
