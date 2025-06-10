import json
import os
import uuid
import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])

def lambda_handler(event, context):
    http_method = event['httpMethod']
    path = event['path']
    body = {}

    if http_method == 'POST' and path == '/notes':
        # Create a new note
        try:
            request_body = json.loads(event['body'])
            note_id = str(uuid.uuid4())
            note_content = request_body['content']

            table.put_item(
                Item={
                    'noteId': note_id,
                    'content': note_content
                }
            )
            body = {"message": "Note created", "noteId": note_id}
            status_code = 201
        except Exception as e:
            body = {"error": str(e)}
            status_code = 400
    elif http_method == 'GET' and path == '/notes':
        # Get all notes
        try:
            response = table.scan()
            body = response['Items']
            status_code = 200
        except Exception as e:
            body = {"error": str(e)}
            status_code = 500
    elif http_method == 'GET' and path.startswith('/notes/'):
        # Get a specific note by ID
        note_id = path.split('/')[-1]
        try:
            response = table.get_item(Key={'noteId': note_id})
            if 'Item' in response:
                body = response['Item']
                status_code = 200
            else:
                body = {"message": "Note not found"}
                status_code = 404
        except Exception as e:
            body = {"error": str(e)}
            status_code = 500
    else:
        body = {"message": "Method Not Allowed or Path Not Found"}
        status_code = 405

    return {
        "statusCode": status_code,
        "body": json.dumps(body),
        "headers": {
            "Content-Type": "application/json"
        }
    }