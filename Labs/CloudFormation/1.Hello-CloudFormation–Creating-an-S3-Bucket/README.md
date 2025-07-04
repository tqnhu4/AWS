
-----

## Exercise 1: Hello CloudFormation – Creating an S3 Bucket

This exercise will guide you through creating a basic CloudFormation template (`template.yaml`) to provision an Amazon S3 bucket. We will then deploy this template using the AWS CLI and retrieve the bucket's generated name using CloudFormation Outputs.

### Objectives:

  * Create a `template.yaml` file.
  * Define an S3 Bucket resource in the template.
  * Deploy the CloudFormation stack using `aws cloudformation deploy`.
  * Add an `Outputs` section to retrieve the S3 bucket's name.

### Prerequisites:

1.  **AWS Account:** You need an active AWS account.
2.  **AWS CLI Configured:** Ensure you have the AWS Command Line Interface (CLI) installed and configured with appropriate credentials (Access Key ID, Secret Access Key, and a default region). You can test this by running `aws s3 ls`.
3.  **Text Editor:** Any text editor (VS Code, Notepad++, Sublime Text, etc.) will work.

### Requirement
Lesson 1. Hello CloudFormation – Create S3 Bucket
Create the first template.yaml file to create an S3 bucket.

Use CLI: aws cloudformation deploy.

Add Outputs to print the bucket name.
-----

### Step 1: Create the CloudFormation Template File

Create a new file named `template.yaml` in your project directory. This file will define the AWS resources you want to create.

```yaml
# template.yaml

AWSTemplateFormatVersion: '2010-09-09'
Description: A simple CloudFormation template to create an S3 bucket for the 'Hello CloudFormation' exercise.

Resources:
  MyFirstS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      # Optional: You can specify a unique bucket name.
      # If not specified, CloudFormation will generate a unique name for you.
      # BucketName: my-unique-cloudformation-bucket-12345
      Tags:
        - Key: Project
          Value: HelloCloudFormation
        - Key: Environment
          Value: Dev

Outputs:
  BucketName:
    Description: The name of the S3 bucket created by this stack.
    Value: !Ref MyFirstS3Bucket
    Export:
      Name: MyFirstS3BucketName
```

#### Explanation of `template.yaml`:

  * **`AWSTemplateFormatVersion: '2010-09-09'`**: This is the template format version. It's a standard declaration and should generally be included.
  * **`Description`**: A brief explanation of what the template does. Good for documentation.
  * **`Resources`**: This is the core section where you define the AWS services you want to provision.
      * **`MyFirstS3Bucket`**: This is the *logical ID* of your S3 bucket resource. It's a unique identifier within your template. You'll use this ID to reference the resource within the template.
      * **`Type: AWS::S3::Bucket`**: Specifies the type of AWS resource you are creating. `AWS::S3::Bucket` indicates an S3 bucket.
      * **`Properties`**: Defines the configuration settings for the resource.
          * `BucketName`: (Optional) You can uncomment this line and provide a globally unique name. If omitted, CloudFormation generates a unique name, which is often preferred for dynamic deployments to avoid naming conflicts.
          * `Tags`: Key-value pairs that help you categorize and manage your AWS resources.
  * **`Outputs`**: This section allows you to export values from your stack, which can then be viewed after the stack is deployed or referenced by other CloudFormation stacks.
      * **`BucketName`**: This is the logical ID for your output value.
      * **`Description`**: A description of the output.
      * **`Value: !Ref MyFirstS3Bucket`**: This is a CloudFormation intrinsic function.
          * `!Ref`: Returns the physical ID of the referenced resource. In this case, it will return the actual (generated) name of the S3 bucket.
          * `MyFirstS3Bucket`: References the logical ID of the S3 bucket defined in the `Resources` section.
      * **`Export:`**: Makes this output value available for reference by other CloudFormation stacks in the same AWS region and account.
          * `Name: MyFirstS3BucketName`: The unique name under which this output will be exported.

-----

### Step 2: Deploy the CloudFormation Stack using AWS CLI

Open your terminal or command prompt, navigate to the directory where you saved `template.yaml`, and run the following command:

```bash
aws cloudformation deploy \
    --stack-name HelloCloudFormationS3Stack \
    --template-file template.yaml \
    --capabilities CAPABILITY_IAM \
    --region us-east-1 # Or your preferred AWS region
```

#### Explanation of the CLI command:

  * **`aws cloudformation deploy`**: This command is part of the AWS CLI's CloudFormation module. It's a higher-level command than `create-stack` or `update-stack` and intelligently handles both creation and updates.
  * **`--stack-name HelloCloudFormationS3Stack`**: This is the name you give to your CloudFormation stack. It must be unique within your AWS account and region.
  * **`--template-file template.yaml`**: Specifies the path to your CloudFormation template file.
  * **`--capabilities CAPABILITY_IAM`**: This flag is required if your template creates or modifies IAM resources (e.g., roles, policies). While an S3 bucket itself doesn't require IAM capabilities, it's a good practice to include it for general templates, or if you later add policies to the bucket that grant access to IAM entities. For this simple S3 bucket without explicit IAM roles, it might not be strictly necessary but doesn't hurt.
  * **`--region us-east-1`**: Specifies the AWS region where you want to deploy the stack. Make sure this matches your AWS CLI configuration or your desired region.

#### What happens after you run the command:

1.  CloudFormation will start creating a "stack" named `HelloCloudFormationS3Stack`.
2.  You can monitor the progress in the AWS CloudFormation console (Services -\> CloudFormation) in the specified region. Look for events under your stack name.
3.  The status will change from `CREATE_IN_PROGRESS` to `CREATE_COMPLETE` once the bucket is successfully created. If there are any errors, it will show `CREATE_FAILED`.

-----

### Step 3: Retrieve the S3 Bucket Name from Outputs

Once the stack status is `CREATE_COMPLETE`, you can view the outputs from the AWS CLI:

```bash
aws cloudformation describe-stacks \
    --stack-name HelloCloudFormationS3Stack \
    --query "Stacks[0].Outputs" \
    --output json \
    --region us-east-1 # Must be the same region as deployment
```

You should see output similar to this (the `OutputValue` will be your actual bucket name):

```json
[
    {
        "OutputKey": "BucketName",
        "OutputValue": "myfirsts3bucket-123xyzabcde1f",
        "Description": "The name of the S3 bucket created by this stack.",
        "ExportName": "MyFirstS3BucketName"
    }
]
```

Alternatively, you can go to the **AWS CloudFormation console**, select your stack (`HelloCloudFormationS3Stack`), and then click on the "Outputs" tab. You will see the `BucketName` and its value there.

-----

### Step 4: Verify the S3 Bucket (Optional)

You can also confirm the S3 bucket exists by listing your S3 buckets via the CLI:

```bash
aws s3 ls
```

You should see your newly created bucket listed (e.g., `myfirsts3bucket-123xyzabcde1f`).

-----

### Step 5: Clean Up (Delete the Stack)

It's good practice to clean up resources after you're done to avoid incurring charges.

To delete the CloudFormation stack and all the resources it created (including your S3 bucket), run:

```bash
aws cloudformation delete-stack \
    --stack-name HelloCloudFormationS3Stack \
    --region us-east-1
```
