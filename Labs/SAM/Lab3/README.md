# Lesson 3: Advanced - Custom Domains, CI/CD, and Layering with SAM
This lesson delves into more advanced topics, crucial for production-ready serverless applications.

Goal: Understand how to set up custom domains for API Gateway, integrate SAM into a CI/CD pipeline, and utilize Lambda Layers for code reuse.


## 1. Custom Domains for API Gateway
Instead of the auto-generated execute-api URL, you often want a friendly, memorable URL (e.g., api.example.com). This requires:

- SSL Certificate: Managed by AWS Certificate Manager (ACM).
- Custom Domain Name: Registered with a domain registrar.
- API Gateway Custom Domain Mapping: Mapping your API to the custom domain.
- Route 53 DNS Record: Pointing your custom domain to the API Gateway endpoint.
While SAM doesn't directly create the ACM certificate or Route 53 record, it can define the API Gateway custom domain mapping.

## 2. CI/CD Integration
Automating deployments is vital for professional development. A typical SAM CI/CD pipeline involves:

- Source Control: Git (e.g., GitHub, CodeCommit).
- Build Stage: sam build to package code and dependencies.
- Test Stage: Run unit/integration tests.
- Deploy Stage: sam deploy to push changes to AWS.
Tools like AWS CodePipeline, GitHub Actions, or GitLab CI can orchestrate this.

## 3. Lambda Layers
Lambda Layers allow you to package and reuse code or dependencies across multiple Lambda functions. This reduces deployment package sizes, improves development efficiency, and promotes best practices.

- Dependency Management: Put common libraries (e.g., requests, pandas) in a layer.
- Code Reusability: Share helper functions or common utilities.

## 4. Advanced Example: Enhanced Notes API with Layer & CI/CD Considerations
Let's enhance our Notes API by adding a shared utility layer and conceptualizing CI/CD. We'll simplify the custom domain to just the SAM template portion for brevity.

## Project Structure:

```text
my-advanced-notes-app/
├── layers/
│   └── common_utils/
│       └── python/
│           └── common_helpers.py  # Shared utility code
├── notes_handler/
│   └── app.py
└── template.yaml
```

layers/common_utils/python/common_helpers.py (Lambda Layer Code):

```python
# layers/common_utils/python/common_helpers.py
import json

def format_response(status_code, body):
    """
    Helper function to format API Gateway responses.
    """
    return {
        "statusCode": status_code,
        "body": json.dumps(body),
        "headers": {
            "Content-Type": "application/json"
        }
    }

def validate_input(data, required_fields):
    """
    Helper function to validate incoming JSON data.
    """
    for field in required_fields:
        if field not in data:
            raise ValueError(f"Missing required field: {field}")
    return True

```

notes_handler/app.py (Modified Lambda Function Code using Layer):

```python
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
```

template.yaml (SAM Template with Layer and Custom Domain Stub):

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: An advanced serverless Notes API with DynamoDB, Lambda Layer, and custom domain consideration.

Parameters:
  TableName:
    Type: String
    Default: AdvancedServerlessNotesTable
    Description: Name of the DynamoDB table for notes
  DomainName: # Parameter for your custom domain
    Type: String
    Description: Your custom domain name (e.g., api.example.com)
    Default: 'api.yourdomain.com' # CHANGE THIS TO YOUR ACTUAL DOMAIN
  BasePath: # Base path for your API
    Type: String
    Description: Base path for the custom domain (e.g., 'notes')
    Default: 'notes'

Resources:
  NotesTable:
    Type: AWS::Serverless::SimpleTable
    Properties:
      TableName: !Ref TableName
      PrimaryKey:
        Name: noteId
        Type: String
      ProvisionedThroughput:
        ReadCapacityUnits: 1
        WriteCapacityUnits: 1

  # Define the Lambda Layer
  CommonUtilsLayer:
    Type: AWS::Serverless::LayerVersion
    Properties:
      LayerName: CommonUtilsPythonLayer
      ContentUri: ./layers/common_utils/ # Path to your layer content
      CompatibleRuntimes:
        - python3.9
      LicenseInfo: 'MIT' # Optional: license info
      RetentionPolicy: Retain # Keep layer version after stack deletion

  NotesFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: notes_handler/app.lambda_handler
      Runtime: python3.9
      CodeUri: ./notes_handler/
      MemorySize: 128
      Timeout: 10
      Environment:
        Variables:
          TABLE_NAME: !Ref NotesTable
      Layers: # Attach the Lambda Layer to the function
        - !Ref CommonUtilsLayer
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref NotesTable
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
            Path: /notes/{noteId}
            Method: get

  # API Gateway Custom Domain Mapping (requires ACM certificate and Route 53 setup outside SAM)
  ApiDomain:
    Type: AWS::ApiGateway::DomainName
    Properties:
      DomainName: !Ref DomainName
      RegionalCertificateArn: # ARN of your ACM certificate for the custom domain
        Fn::ImportValue: YourACMCertificateArn # Assuming you export this from another stack or manual setup
      EndpointConfiguration:
        Types:
          - REGIONAL

  ApiMapping:
    Type: AWS::ApiGateway::BasePathMapping
    Properties:
      DomainName: !Ref DomainName
      RestApiId: !Ref ServerlessRestApi # Refers to the auto-created API Gateway
      Stage: Prod # The stage name of your API
      BasePath: !Ref BasePath # e.g., 'notes' so the URL becomes api.example.com/notes/your-path

Outputs:
  NotesApiUrl:
    Description: "API Gateway endpoint URL (auto-generated)"
    Value: !Sub "https://${ServerlessRestApi}.execute-api.${AWS::Region}.amazonaws.com/Prod/"
  CustomDomainUrl:
    Description: "Custom Domain URL for Notes API (requires DNS setup)"
    Value: !Sub "https://${DomainName}/${BasePath}"


```

## 5. Deployment Considerations:
- ACM Certificate & Route 53: Before deploying the custom domain part, ensure you have an SSL certificate for yourdomain.com (and api.yourdomain.com) in ACM in the same region as your API Gateway, and create a Route 53 A-record pointing your custom domain to the API Gateway regional domain name (which SAM will output).
- Fn::ImportValue: The example uses Fn::ImportValue for the certificate ARN. This means the certificate must be created in a separate CloudFormation stack and its ARN explicitly exported. For simplicity in a single stack, you might hardcode the ARN if you know it, but importing is best practice.
- Build and Deploy:
  - sam build (This will package the layer and function code)
  - sam deploy --guided (Provide values for DomainName and BasePath).

## 6. CI/CD Pipeline (Conceptual):
A buildspec.yml for AWS CodeBuild or a .github/workflows/deploy.yml for GitHub Actions would typically look like:  

```yaml
# Simplified example for GitHub Actions (deploy.yml)
name: Deploy SAM Application

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1 # Or your desired region

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'

      - name: Install SAM CLI
        run: pip install aws-sam-cli

      - name: Build SAM application
        run: sam build

      - name: Deploy SAM application
        run: sam deploy --stack-name MyAdvancedNotesApp --region us-east-1 --no-confirm-changeset --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM
        env:
          DOMAIN_NAME: api.yourdomain.com # Pass as environment variable or parameter
          BASE_PATH: notes
```

Key Takeaway: Advanced SAM development involves building robust, production-ready applications. This includes implementing custom domains for better UX, leveraging Lambda Layers for modularity and efficiency, and integrating sam build and sam deploy into automated CI/CD pipelines for reliable deployments.