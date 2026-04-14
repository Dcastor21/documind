import json
import os
import urllib.parse
from datetime import datetime, timezone
from decimal import Decimal

import boto3

from helpers import api_response

# Initialize AWS clients outside the handler for connection reuse
textract = boto3.client("textract")
comprehend = boto3.client("comprehend")
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["DOCUMENTS_TABLE"])


def handler(event, context):
    """Process uploaded documents through Textract and Comprehend."""
    # Extract bucket and key from the S3 event
    record = event["Records"][0]
    bucket = record["s3"]["bucket"]["name"]
    key = urllib.parse.unquote_plus(record["s3"]["object"]["key"])

    # Parse documentId from the S3 key pattern: uploads/<documentId>/<filename>
    parts = key.split("/")
    if len(parts) < 3:
        print(f"Unexpected S3 key format: {key}")
        return

    document_id = parts[1]
    print(f"Processing document: {document_id}, key: {key}")

    try:
        # Update status to processing
        update_status(document_id, "processing")

        # ──── Step 1: OCR via Amazon Textract ────
        textract_response = textract.detect_document_text(
            Document={
                "S3Object": {
                    "Bucket": bucket,
                    "Name": key,
                }
            }
        )

        # Extract text lines
        lines = [
            block for block in textract_response["Blocks"]
            if block["BlockType"] == "LINE"
        ]
        extracted_text = "\n".join(block["Text"] for block in lines)

        # Calculate average OCR confidence
        if lines:
            avg_confidence = sum(
                block.get("Confidence", 0) for block in lines
            ) / len(lines)
        else:
            avg_confidence = 0.0

        print(
            f"Textract: extracted {len(extracted_text)} chars, "
            f"{len(lines)} lines, avg confidence: {avg_confidence:.2f}%"
        )

        # ──── Step 2: Entity Extraction via Amazon Comprehend ────
        # Comprehend has a 5,000 UTF-8 byte limit per request
        text_for_comprehend = extracted_text[:4900]

        entities_response = comprehend.detect_entities(
            Text=text_for_comprehend,
            LanguageCode="en",
        )

        entities = [
            {
                "text": entity["Text"],
                "type": entity["Type"],
                "score": Decimal(str(round(entity["Score"], 4))),
                "beginOffset": entity["BeginOffset"],
                "endOffset": entity["EndOffset"],
            }
            for entity in entities_response["Entities"]
        ]

        # ──── Step 3: Sentiment Analysis via Amazon Comprehend ────
        sentiment_response = comprehend.detect_sentiment(
            Text=text_for_comprehend,
            LanguageCode="en",
        )

        sentiment = {
            "overall": sentiment_response["Sentiment"],
            "scores": {
                k: Decimal(str(round(v, 4)))
                for k, v in sentiment_response["SentimentScore"].items()
            },
        }

        # ──── Step 4: Write structured results to DynamoDB ────
        now = datetime.now(timezone.utc).isoformat()

        table.update_item(
            Key={"documentId": document_id},
            UpdateExpression=(
                "SET #s = :status, "
                "extractedText = :text, "
                "entities = :entities, "
                "sentiment = :sentiment, "
                "textractConfidence = :conf, "
                "blockCount = :blocks, "
                "entityCount = :ec, "
                "updatedAt = :ua"
            ),
            ExpressionAttributeNames={"#s": "status"},
            ExpressionAttributeValues={
                ":status": "completed",
                ":text": extracted_text,
                ":entities": entities,
                ":sentiment": sentiment,
                ":conf": Decimal(str(round(avg_confidence, 2))),
                ":blocks": len(textract_response["Blocks"]),
                ":ec": len(entities),
                ":ua": now,
            },
        )

        print(
            f"Document {document_id} processed successfully: "
            f"{len(entities)} entities found, sentiment: {sentiment['overall']}"
        )

        return {"statusCode": 200, "body": "Processing complete"}

    except Exception as e:
        print(f"Error processing document {document_id}: {e}")
        update_status(document_id, "failed", error_message=str(e))
        # Re-raise so the DLQ captures the failure
        raise


def update_status(document_id, status, error_message=None):
    """Update the processing status of a document in DynamoDB."""
    now = datetime.now(timezone.utc).isoformat()

    update_expr = "SET #s = :status, updatedAt = :ua"
    expr_values = {
        ":status": status,
        ":ua": now,
    }

    if error_message:
        update_expr += ", errorMessage = :err"
        expr_values[":err"] = error_message

    table.update_item(
        Key={"documentId": document_id},
        UpdateExpression=update_expr,
        ExpressionAttributeNames={"#s": "status"},
        ExpressionAttributeValues=expr_values,
    )