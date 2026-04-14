import json
import os
import uuid
from datetime import datetime, timezone

import boto3
from botocore.config import Config

from helpers import api_response

# Initialize AWS clients outside the handler for connection reuse
s3 = boto3.client("s3", config=Config(signature_version="s3v4"))
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["DOCUMENTS_TABLE"])
BUCKET = os.environ["UPLOAD_BUCKET"]


def handler(event, context):
    """Generate a pre-signed S3 URL and create a DynamoDB tracking record."""
    try:
        body = json.loads(event["body"])
        filename = body.get("filename")
        content_type = body.get("contentType")
        document_type = body.get("documentType", "unknown")

        # Validate required fields
        if not filename or not content_type:
            return api_response(400, {"error": "filename and contentType are required"})

        # Validate file type
        allowed_types = ["application/pdf", "image/png", "image/jpeg"]
        if content_type not in allowed_types:
            return api_response(400, {"error": f"Unsupported file type: {content_type}"})

        document_id = str(uuid.uuid4())
        s3_key = f"uploads/{document_id}/{filename}"
        now = datetime.now(timezone.utc).isoformat()

        # Generate pre-signed upload URL (expires in 5 minutes)
        upload_url = s3.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": BUCKET,
                "Key": s3_key,
            },
            ExpiresIn=300,
        )

        # Create tracking record in DynamoDB
        table.put_item(
            Item={
                "documentId": document_id,
                "filename": filename,
                "contentType": content_type,
                "documentType": document_type,
                "s3Key": s3_key,
                "status": "uploaded",
                "createdAt": now,
                "updatedAt": now,
            }
        )

        return api_response(200, {"uploadUrl": upload_url, "documentId": document_id})

    except json.JSONDecodeError:
        return api_response(400, {"error": "Invalid JSON in request body"})
    except Exception as e:
        print(f"Upload error: {e}")
        return api_response(500, {"error": "Failed to generate upload URL"})