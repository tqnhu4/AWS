# Lesson 2: Intermediate - Building a CRUD API with DynamoDB Integration
This lesson expands on the basics by integrating a serverless database (DynamoDB) and implementing basic CRUD (Create, Read, Update, Delete) operations through our API.

Goal: Learn how to define a DynamoDB table, grant Lambda permissions, and handle different HTTP methods for data manipulation.


## 1. Integrating DynamoDB
- Serverless applications often require a database. DynamoDB is a popular choice due to its serverless nature, scalability, and performance.

- AWS::Serverless::SimpleTable: SAM's simplified resource type for creating a DynamoDB table. It automatically provisions a primary key.
- IAM Roles and Permissions: Your Lambda function needs explicit permissions to interact with DynamoDB (e.g., dynamodb:PutItem, dynamodb:GetItem). SAM allows you to easily attach policies.

## 2. Intermediate Example: Simple Notes API
Let's build an API to create, read, and list notes.

## Project Structure:

```text
my-notes-app/
├── notes_handler/
│   └── app.py
└── template.yaml
```

notes_handler/app.py (Lambda Function Code):

```python
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
```

template.yaml (SAM Template):

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: A serverless Notes API with DynamoDB integration.

Parameters:
  TableName:
    Type: String
    Default: ServerlessNotesTable
    Description: Name of the DynamoDB table for notes

Resources:
  NotesTable: # DynamoDB Table resource
    Type: AWS::Serverless::SimpleTable
    Properties:
      TableName: !Ref TableName
      PrimaryKey:
        Name: noteId
        Type: String
      ProvisionedThroughput:
        ReadCapacityUnits: 1
        WriteCapacityUnits: 1

  NotesFunction: # Lambda Function resource
    Type: AWS::Serverless::Function
    Properties:
      Handler: notes_handler/app.lambda_handler
      Runtime: python3.9
      CodeUri: ./notes_handler/
      MemorySize: 128
      Timeout: 10
      Environment: # Pass environment variables to Lambda
        Variables:
          TABLE_NAME: !Ref NotesTable # Reference the table name defined above
      Policies: # Grant permissions to Lambda function
        - DynamoDBCrudPolicy: # AWS Managed Policy for CRUD on DynamoDB
            TableName: !Ref NotesTable # Grant permissions on this specific table
      Events:
        CreateNoteApi:
          Type: Api
          Properties:
            Path: /notes
            Method: post
        ListNotesApi:
          Type: Api
          Properties:
            Path: /notes
            Method: get
        GetNoteByIdApi:
          Type: Api
          Properties:
            Path: /notes/{noteId} # Path parameter for retrieving specific notes
            Method: get

Outputs:
  NotesApiUrl:
    Description: "API Gateway endpoint URL for Notes API"
    Value: !Sub "https://${ServerlessRestApi}.execute-api.${AWS::Region}.amazonaws.com/Prod/"
```

## 3. Steps to Deploy:
- Navigate to project directory: cd my-notes-app
- Build: sam build
- Deploy: sam deploy --guided
- Test:
  - POST (Create): curl -X POST -H "Content-Type: application/json" -d '{"content":"My first note"}' <NotesApiUrl>notes
  - GET (List): curl <NotesApiUrl>notes
  - GET (Specific): curl <NotesApiUrl>notes/<YOUR_NOTE_ID> (replace <YOUR_NOTE_ID> with the ID returned from the POST request)
- Key Takeaway: Intermediate SAM involves integrating other AWS services like DynamoDB. Environment variables are used to pass configuration to Lambda, and Policies are crucial for granting necessary permissions securely. Path parameters in API Gateway enable more dynamic routing.