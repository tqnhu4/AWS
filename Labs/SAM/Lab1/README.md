# Lesson 1: Basic - Building Your First Serverless API with SAM
This lesson introduces the fundamentals of SAM, focusing on how to set up a simple "Hello World" API.

Goal: Understand the basic structure of a SAM template and deploy a simple Lambda function triggered by API Gateway.

## 1. What is AWS SAM?
AWS Serverless Application Model (SAM) is an open-source framework for building serverless applications on AWS. It's a CloudFormation extension that simplifies the definition of serverless resources like Lambda functions, APIs, DynamoDB tables, and more.

## 2. Core Concepts
- SAM Template (template.yaml): A YAML file that defines your serverless resources. It's transformed into CloudFormation.
- Transform: AWS::Serverless-2016-10-31: This line is crucial in your SAM template. It tells CloudFormation to process your template using the SAM specification.
- AWS::Serverless::Function: The SAM resource type for an AWS Lambda function.
- Events: Defines what triggers your Lambda function (e.g., an API Gateway endpoint, S3 event, DynamoDB stream).
- sam build: Prepares your application for deployment by packaging code and dependencies.
- sam deploy: Deploys your SAM application to AWS via CloudFormation.
- sam local start-api: Allows you to test your API Gateway-triggered Lambda functions locally.

## 3. Basic Example: "Hello World" API
Let's create a Lambda function that returns "Hello, World!" via an API Gateway endpoint.

## Project Structure:
```text
my-hello-app/
├── hello_world/
│   └── app.py
└── template.yaml
```

hello_world/app.py (Lambda Function Code):

```python
import json

def lambda_handler(event, context):
    """
    A simple Lambda function that returns "Hello, World!"
    """
    return {
        "statusCode": 200,
        "body": json.dumps({
            "message": "Hello, World from Lambda!",
        }),
        "headers": {
            "Content-Type": "application/json"
        }
    }
```

template.yaml (SAM Template):

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: A basic Hello World API using SAM.

Resources:
  HelloWorldFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: hello_world/app.lambda_handler # Points to your Python handler
      Runtime: python3.9
      CodeUri: ./hello_world/ # Directory containing your Lambda code
      MemorySize: 128
      Timeout: 3
      Events:
        HelloWorldApi:
          Type: Api # Defines an API Gateway trigger
          Properties:
            Path: /hello
            Method: get
Outputs: # Optional: to output the API endpoint URL after deployment
  HelloWorldApiUrl:
    Description: "API Gateway endpoint URL for Hello World function"
    Value: !Sub "https://${ServerlessRestApi}.execute-api.${AWS::Region}.amazonaws.com/Prod/hello"
```

## 4. Steps to Run and Deploy:
- Install SAM CLI: pip install aws-sam-cli
- Navigate to project directory: cd my-hello-app
- Build: sam build
- Local Test: sam local start-api (then open http://127.0.0.1:3000/hello in your browser)
- Ploy: sam deploy --guided (follow prompts: stack name, region, etc.)
- Access: After successful deployment, CloudFormation will output the HelloWorldApiUrl. Use this URL in your browser or curl.
- Key Takeaway: SAM simplifies serverless application definition and deployment. AWS::Serverless::Function and Events are fundamental to connecting your code to triggers.

