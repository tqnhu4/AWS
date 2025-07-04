


-----

## Exercise 2: Creating a Simple EC2 Instance

This exercise will guide you through creating a CloudFormation template (`template.yaml`) to provision a single Amazon EC2 instance. We will use **Parameters** to allow users to specify the Amazon Machine Image (AMI) ID during deployment and apply **Tags** for better resource management.

### Objectives:

  * Create a `template.yaml` file to define an EC2 instance.
  * Utilize `Parameters` to accept an AMI ID from the user.
  * Assign tags to the EC2 instance.
  * Deploy the stack using `aws cloudformation deploy`.
  * Clean up the deployed resources.

### Requirement
Lesson 2. Create a simple EC2
Create an EC2 instance (Amazon Linux).

Use Parameters to get the AMI ID from the user.

Assign a name (Tags) to the EC2.

### Prerequisites:

  * **AWS Account:** Active AWS account.
  * **AWS CLI Configured:** Installed and configured with appropriate credentials.
  * **Text Editor:** Any text editor.

-----

### Step 1: Create the CloudFormation Template File

Create a new file named `template.yaml` in your project directory.

```yaml
# template.yaml

AWSTemplateFormatVersion: '2010-09-09'
Description: A CloudFormation template to create a simple EC2 instance (Amazon Linux).

Parameters:
  AmiId:
    Description: The Amazon Machine Image (AMI) ID for the EC2 instance.
    Type: String
    Default: ami-080e1f37e45293bb8 # Default for Amazon Linux 2023 (t2.micro/t3.micro compatible) in us-east-1 as of early 2025. ALWAYS VERIFY THE LATEST AMI ID FOR YOUR REGION!
    AllowedPattern: "^ami-[0-9a-fA-F]{8,17}$"
    ConstraintDescription: Must be a valid AMI ID (e.g., ami-0abcdef1234567890).

  InstanceType:
    Description: The EC2 instance type.
    Type: String
    Default: t2.micro # Common free-tier eligible instance type
    AllowedValues:
      - t2.micro
      - t3.micro
      - t3a.micro
    ConstraintDescription: Must be a valid EC2 instance type.

Resources:
  MySimpleEC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Ref AmiId # Use the AMI ID from the Parameters section
      InstanceType: !Ref InstanceType # Use the Instance Type from the Parameters section
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-MySimpleEC2' # Dynamic Name based on Stack Name
        - Key: Project
          Value: CloudFormationExercises
        - Key: Environment
          Value: Development

Outputs:
  InstanceId:
    Description: The ID of the created EC2 instance.
    Value: !Ref MySimpleEC2Instance
  PublicIp:
    Description: The public IP address of the EC2 instance.
    Value: !GetAtt MySimpleEC2Instance.PublicIp
  PrivateIp:
    Description: The private IP address of the EC2 instance.
    Value: !GetAtt MySimpleEC2Instance.PrivateIp
```

#### Explanation of `template.yaml`:

  * **`Parameters`**: This section allows you to define input values that you can specify when you create or update a stack.
      * **`AmiId`**:
          * `Description`: A helpful message for the user.
          * `Type: String`: Indicates that the input will be a text string.
          * `Default`: Provides a default AMI ID. **IMPORTANT**: AMI IDs are region-specific and change over time. The provided AMI (`ami-080e1f37e45293bb8`) is for **Amazon Linux 2023 in `us-east-1` (N. Virginia)** as of early 2025. **You MUST verify the correct AMI ID for your chosen region** by checking the EC2 console or AWS documentation for "Amazon Linux 2023 AMI". Using an incorrect AMI ID will cause stack creation to fail.
          * `AllowedPattern`: A regular expression to validate the format of the AMI ID.
          * `ConstraintDescription`: An error message if the `AllowedPattern` is not met.
      * **`InstanceType`**:
          * Defines the EC2 instance type (e.g., `t2.micro`).
          * `AllowedValues`: Restricts the user to a predefined list of values, preventing invalid types.
  * **`Resources`**:
      * **`MySimpleEC2Instance`**: The logical ID for your EC2 instance.
      * **`Type: AWS::EC2::Instance`**: Specifies that we are creating an EC2 instance.
      * **`Properties`**:
          * **`ImageId: !Ref AmiId`**: This is how you reference a parameter. `!Ref AmiId` tells CloudFormation to use the value provided for the `AmiId` parameter.
          * **`InstanceType: !Ref InstanceType`**: Similarly, uses the value from the `InstanceType` parameter.
          * **`Tags`**: Key-value pairs for organizing your EC2 instance.
              * **`Name: !Sub '${AWS::StackName}-MySimpleEC2'`**:
                  * `!Sub`: An intrinsic function that substitutes variables in a string.
                  * `${AWS::StackName}`: A pseudo-parameter provided by CloudFormation that automatically resolves to the name of the current stack (`EC2SimpleStack` in our case). This is a best practice for dynamic naming.
  * **`Outputs`**: This section exports useful information about the created resources.
      * **`InstanceId: !Ref MySimpleEC2Instance`**: Exports the actual physical ID of the EC2 instance.
      * **`PublicIp: !GetAtt MySimpleEC2Instance.PublicIp`**:
          * `!GetAtt`: Another intrinsic function to retrieve an attribute from a resource.
          * `MySimpleEC2Instance.PublicIp`: Specifies to get the `PublicIp` attribute of the resource with logical ID `MySimpleEC2Instance`.
      * **`PrivateIp: !GetAtt MySimpleEC2Instance.PrivateIp`**: Similar to `PublicIp`, but retrieves the private IP address.

-----

### Step 2: Find the Correct AMI ID for Your Region

Before deploying, **you must find a valid Amazon Linux 2023 (or Amazon Linux 2) AMI ID for your desired AWS region.**

1.  **Go to the EC2 Console:** Log in to your AWS Management Console.

2.  **Select Your Region:** In the top right corner, select the AWS region where you intend to deploy (e.g., `us-east-1` (N. Virginia), `eu-central-1` (Frankfurt), `ap-southeast-1` (Singapore)).

3.  **Launch Instance Wizard:** Go to "EC2" -\> "Instances" -\> "Launch Instances".

4.  **Find AMI ID:** Look for "Amazon Linux 2023 AMI" or "Amazon Linux 2 AMI". You will see an AMI ID next to it (e.g., `ami-0abcdef1234567890`). Copy this ID.

5.  **Update `template.yaml`:** Replace the `Default` value for `AmiId` in your `template.yaml` with the correct AMI ID you just found.

    *Example (for `us-east-1` with a placeholder value):*

    ```yaml
    AmiId:
      Description: The Amazon Machine Image (AMI) ID for the EC2 instance.
      Type: String
      Default: ami-0123456789abcdef0 # <--- REPLACE WITH YOUR ACTUAL AMI ID for your region
      AllowedPattern: "^ami-[0-9a-fA-F]{8,17}$"
      ConstraintDescription: Must be a valid AMI ID (e.g., ami-0abcdef1234567890).
    ```

-----

### Step 3: Deploy the CloudFormation Stack using AWS CLI

Open your terminal or command prompt, navigate to the directory where you saved `template.yaml`, and run the following command:

```bash
aws cloudformation deploy \
    --stack-name EC2SimpleStack \
    --template-file template.yaml \
    --capabilities CAPABILITY_IAM \
    --region us-east-1 # Or your chosen AWS region
```

  * **`--stack-name EC2SimpleStack`**: The name for your CloudFormation stack.
  * **`--template-file template.yaml`**: Path to your template.
  * **`--capabilities CAPABILITY_IAM`**: Still a good habit, though not strictly required for this basic EC2 instance unless you later add IAM roles to it.
  * **`--region us-east-1`**: **Ensure this matches the region for which you obtained the AMI ID.**

#### What happens after you run the command:

1.  CloudFormation will start creating the `EC2SimpleStack`.
2.  You can monitor its progress in the AWS CloudFormation console.
3.  The status will eventually change to `CREATE_COMPLETE`.

-----

### Step 4: View Stack Outputs

Once the stack is `CREATE_COMPLETE`, retrieve the outputs using the AWS CLI:

```bash
aws cloudformation describe-stacks \
    --stack-name EC2SimpleStack \
    --query "Stacks[0].Outputs" \
    --output json \
    --region us-east-1 # Same region as deployment
```

You should see output similar to this (actual IDs and IPs will vary):

```json
[
    {
        "OutputKey": "InstanceId",
        "OutputValue": "i-0abcdef1234567890",
        "Description": "The ID of the created EC2 instance."
    },
    {
        "OutputKey": "PublicIp",
        "OutputValue": "54.234.56.78",
        "Description": "The public IP address of the EC2 instance."
    },
    {
        "OutputKey": "PrivateIp",
        "OutputValue": "172.31.0.123",
        "Description": "The private IP address of the EC2 instance."
    }
]
```

You can also verify the instance and its tags by navigating to the **EC2 console** in your chosen region.

-----

### Step 5: Clean Up (Delete the Stack)

To avoid unwanted charges, delete the CloudFormation stack and all associated resources:

```bash
aws cloudformation delete-stack \
    --stack-name EC2SimpleStack \
    --region us-east-1
```
