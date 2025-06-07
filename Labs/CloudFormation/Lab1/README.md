## Deploy an AWS Lambda Function using AWS CloudFormation.

## ✅ 1. PREPARATION
### Requirements:
A Lambda source code file (index.js)

A CloudFormation template file (lambda.yaml)

AWS CLI installed and configured (aws configure)

IAM user with permissions: cloudformation:*, lambda:*, iam:PassRole, s3:*

### ✅ 2. CREATE LAMBDA SOURCE CODE FILE
```javascript
index.js

exports.handler = async (event) => {
    return {
        statusCode: 200,
        body: JSON.stringify({ message: "Hello from Lambda!" }),
    };
};
```
### ✅ 3. CREATE CLOUDFORMATION TEMPLATE
```yaml
lambda.yaml

AWSTemplateFormatVersion: '2010-09-09'
Description: Simple Lambda Function

Resources:
  MyLambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: my-lambda-execution-role
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: lambda-logging
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: "*"

  MyLambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: my-lambda-function
      Handler: index.handler
      Role: !GetAtt MyLambdaExecutionRole.Arn
      Runtime: nodejs18.x
      Code:
        ZipFile: |
          exports.handler = async (event) => {
              return {
                  statusCode: 200,
                  body: JSON.stringify({ message: "Hello from Lambda!" }),
              };
          };
      Timeout: 10
```

- 🔥 Note: Here we use ZipFile directly in the template to simplify deployment without having to upload the code to S3.

### ✅ 4. TEMPLATE DEPLOYMENT
Run the following command in the directory containing lambda.yaml:
```bash
aws cloudformation create-stack\ 
--stack-name lambda-demo-stack \ 
--template-body file://lambda.yaml \ 
--capabilities CAPABILITY_NAMED_IAM
--capabilities CAPABILITY_NAMED_IAM allows CloudFormation to create an IAM Role.
```

### ✅ 5. CHECK THE CREATED LAMBDA
You can check in AWS Console → Lambda → my-lambda-function, or run the following command:
```bash
aws lambda invoke --function-name my-lambda-function output.txt
cat output.txt

```
### ✅ 6. DELETE STACK (if needed)
```bash
aws cloudformation delete-stack --stack-name lambda-demo-stack
```

### ✅ SUMMARY
Step Description
- Create an index.js source file or use ZipFile directly
- Create a CloudFormation template Define Lambda, Role, Permissions
- Deploy using AWS CLI Use create-stack
- Check and invoke function Via CLI or Console


====

Update

### USE ZipFile DIRECTLY IN TEMPLATE (INLINE CODE)
If you are using Code.ZipFile in template.yaml (like the example above):

🛠 Update as follows:
Change the content of the Lambda function in the ZipFile section:

Run the following command again:

```bash
aws cloudformation update-stack \
--stack-name lambda-demo-stack \
--template-body file://lambda.yaml \
--capabilities CAPABILITY_NAMED_IAM
```

### ✅ CloudFormation will automatically detect the changed code and update the Lambda function.