import json
import os
import uuid
import boto3
import common_helpers # Import from the layer

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])

def lambda_handler(event, context):
    http_method = event['httpMethod']
    path = event['path']
    body = {}

    if http_method == 'POST' and path == '/notes':
        try:
            request_body = json.loads(event['body'])
            common_helpers.validate_input(request_body, ['content']) # Use helper from layer

            note_id = str(uuid.uuid4())
            note_content = request_body['content']

            table.put_item(Item={'noteId': note_id, 'content': note_content})
            return common_helpers.format_response(201, {"message": "Note created", "noteId": note_id})
        except ValueError as e:
            return common_helpers.format_response(400, {"error": str(e)})
        except Exception as e:
            return common_helpers.format_response(500, {"error": "Failed to create note"})
    # ... (GET /notes and GET /notes/{noteId} logic remains similar,
    #      but can also use common_helpers.format_response)
    elif http_method == 'GET' and path == '/notes':
        try:
            response = table.scan()
            return common_helpers.format_response(200, response['Items'])
        except Exception as e:
            return common_helpers.format_response(500, {"error": "Failed to list notes"})
    elif http_method == 'GET' and path.startswith('/notes/'):
        note_id = path.split('/')[-1]
        try:
            response = table.get_item(Key={'noteId': note_id})
            if 'Item' in response:
                return common_helpers.format_response(200, response['Item'])
            else:
                return common_helpers.format_response(404, {"message": "Note not found"})
        except Exception as e:
            return common_helpers.format_response(500, {"error": "Failed to retrieve note"})
    else:
        return common_helpers.format_response(405, {"message": "Method Not Allowed or Path Not Found"})