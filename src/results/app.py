import json
import os
from decimal import Decimal

import boto3

from helpers import api_response

# Initialize AWS clients outside the handler for connection reuse
s3 = boto3.client("s3")
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["DOCUMENTS_TABLE"])
BUCKET = os.environ["UPLOAD_BUCKET"]


class DecimalEncoder(json.JSONEncoder):
    """Custom JSON encoder that converts Decimal to float for API responses."""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)


def handler(event, context):
    """Route API Gateway requests to the appropriate handler."""
    method = event["httpMethod"]
    path_params = event.get("pathParameters") or {}
    query_params = event.get("queryStringParameters") or {}

    try:
        # GET /api/documents/:id
        if method == "GET" and path_params.get("id"):
            return get_document(path_params["id"])

        # GET /api/documents
        if method == "GET":
            return list_documents(query_params)

        # DELETE /api/documents/:id
        if method == "DELETE" and path_params.get("id"):
            return delete_document(path_params["id"])

        return api_response(405, {"error": "Method not allowed"})

    except Exception as e:
        print(f"Results API error: {e}")
        return api_response(500, {"error": "Internal server error"})


def get_document(document_id):
    """Retrieve a single document's processing results."""
    result = table.get_item(Key={"documentId": document_id})
    item = result.get("Item")

    if not item:
        return api_response(404, {"error": "Document not found"})

    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
        },
        "body": json.dumps(item, cls=DecimalEncoder),
    }


def list_documents(query_params):
    """List all documents with optional filtering by status."""
    status = query_params.get("status")
    limit = int(query_params.get("limit", 20))

    if status:
        # Query the GSI for filtered results
        result = table.query(
            IndexName="StatusCreatedAtIndex",
            KeyConditionExpression="#s = :status",
            ExpressionAttributeNames={"#s": "status"},
            ExpressionAttributeValues={":status": status},
            ScanIndexForward=False,  # newest first
            Limit=limit,
        )
    else:
        # Scan for all documents
        result = table.scan(Limit=limit)

    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
        },
        "body": json.dumps(
            {
                "documents": result.get("Items", []),
                "totalCount": result.get("Count", 0),
            },
            cls=DecimalEncoder,
        ),
    }


def delete_document(document_id):
    """Delete a document from DynamoDB and its file from S3."""
    # Fetch the document to get the S3 key
    result = table.get_item(Key={"documentId": document_id})
    item = result.get("Item")

    if not item:
        return api_response(404, {"error": "Document not found"})

    # Delete from S3
    s3_key = item.get("s3Key")
    if s3_key:
        try:
            s3.delete_object(Bucket=BUCKET, Key=s3_key)
        except Exception as e:
            print(f"Warning: failed to delete S3 object {s3_key}: {e}")

    # Delete from DynamoDB
    table.delete_item(Key={"documentId": document_id})

    return api_response(200, {"success": True, "documentId": document_id})