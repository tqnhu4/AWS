
-----

## Exercise 3: Attaching a Security Group to EC2

This exercise builds upon the previous one by demonstrating how to define an AWS Security Group in CloudFormation, configure it to allow specific inbound traffic (SSH and HTTP), and then attach this Security Group to your EC2 instance.

### Objectives:

  * Create an `AWS::EC2::SecurityGroup` resource.
  * Define inbound rules for SSH (port 22) and HTTP (port 80).
  * Modify the `AWS::EC2::Instance` resource to use the newly created Security Group.
  * Deploy and verify the stack.
  * Clean up resources.

### Requirement
Lesson 3. Attach Security Group to EC2
Create a security group allowing ports 22, 80.

Attach to EC2 in lesson 2.

### Prerequisites:

  * **AWS Account and CLI Configured:** As with previous exercises.
  * **Understanding of Security Groups:** Basic knowledge of how AWS Security Groups function (acting as virtual firewalls).

-----

### Step 1: Create or Update the CloudFormation Template File

Let's modify the `template.yaml` file from Exercise 2. If you don't have it, you can create a new one with the content below.

```yaml
# template.yaml

AWSTemplateFormatVersion: '2010-09-09'
Description: A CloudFormation template to create an EC2 instance with a custom Security Group allowing SSH and HTTP traffic.

Parameters:
  AmiId:
    Description: The Amazon Machine Image (AMI) ID for the EC2 instance.
    Type: String
    Default: ami-080e1f37e45293bb8 # Default for Amazon Linux 2023 (t2.micro/t3.micro compatible) in us-east-1. ALWAYS VERIFY FOR YOUR REGION!
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

  SshLocation: # New parameter for SSH source IP
    Description: The IP address range that can SSH to the EC2 instance (CIDR notation).
    Type: String
    MinLength: 9
    MaxLength: 18
    Default: 0.0.0.0/0 # WARNING: This allows SSH from anywhere. Restrict for production!
    AllowedPattern: "^([0-9]{1,3}\\.){3}[0-9]{1,3}(\\/([0-9]|[1-2][0-9]|3[0-2]))?$"
    ConstraintDescription: Must be a valid IP CIDR range.

Resources:
  # --- New: Security Group Resource ---
  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AWS::StackName}-SecurityGroup'
      GroupDescription: Enable SSH access on port 22 and HTTP access on port 80.
      SecurityGroupIngress: # Inbound rules
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref SshLocation # Allows SSH from the specified SshLocation parameter
          Description: Allow SSH access
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0 # WARNING: Allows HTTP from anywhere.
          Description: Allow HTTP access
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-SG'
        - Key: Project
          Value: CloudFormationExercises

  # --- Existing: EC2 Instance Resource (Modified) ---
  MySimpleEC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Ref AmiId
      InstanceType: !Ref InstanceType
      # Highlighted change: Attach the Security Group
      SecurityGroupIds:
        - !Ref EC2SecurityGroup # Referencing the logical ID of our new Security Group
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-MySimpleEC2'
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
  SecurityGroupId: # New output
    Description: The ID of the created Security Group.
    Value: !Ref EC2SecurityGroup
```

#### Key Changes and Explanation:

1.  **New Parameter: `SshLocation`**:

      * This parameter allows you to specify the **CIDR block** from which SSH access will be permitted.
      * `Default: 0.0.0.0/0` means SSH is allowed from *anywhere*. **For production environments, you should always restrict this to your specific IP address or corporate network CIDR for security.** You can find your public IP using websites like `whatismyip.com` and then appending `/32` (e.g., `192.168.1.100/32`).

2.  **New Resource: `EC2SecurityGroup`**:

      * **`Type: AWS::EC2::SecurityGroup`**: Defines a new Security Group.
      * **`GroupName`**: A user-friendly name for the Security Group. We use `!Sub` again to include the stack name for uniqueness.
      * **`GroupDescription`**: A description for the Security Group, explaining its purpose.
      * **`SecurityGroupIngress`**: This property defines the **inbound (ingress) rules** for the Security Group.
          * **SSH Rule (Port 22)**:
              * `IpProtocol: tcp`
              * `FromPort: 22`, `ToPort: 22`
              * `CidrIp: !Ref SshLocation`: Dynamically pulls the allowed IP range from our `SshLocation` parameter.
          * **HTTP Rule (Port 80)**:
              * `IpProtocol: tcp`
              * `FromPort: 80`, `ToPort: 80`
              * `CidrIp: 0.0.0.0/0`: Allows HTTP traffic from any IP address. This is common for web servers.
      * **`Tags`**: As before, for organizational purposes.

3.  **Modified `MySimpleEC2Instance` Resource**:

      * **`SecurityGroupIds: - !Ref EC2SecurityGroup`**: This is the crucial part that links the EC2 instance to the Security Group.
          * `SecurityGroupIds`: This property of `AWS::EC2::Instance` takes a list of Security Group IDs.
          * `!Ref EC2SecurityGroup`: References the logical ID of our newly defined Security Group, telling CloudFormation to attach it.

4.  **New Output: `SecurityGroupId`**:

      * Exports the ID of the created Security Group, which can be useful for verification or for connecting other resources.

-----

### Step 2: Verify AMI ID and Consider `SshLocation`

1.  **Re-verify AMI ID:** As in Exercise 2, ensure the `Default` AMI ID in your `template.yaml` for the `AmiId` parameter is correct for your chosen AWS region.

2.  **Consider `SshLocation`:** Decide if you want to use the default `0.0.0.0/0` (less secure but easier for initial testing) or if you want to provide your specific public IP address (more secure).

      * **To find your public IP (CIDR format):** Go to `https://whatismyip.com/` and copy your IP. Then append `/32` to it (e.g., if your IP is `203.0.113.45`, use `203.0.113.45/32`). You can then pass this as a parameter during deployment.

-----

### Step 3: Deploy the CloudFormation Stack

Open your terminal or command prompt, navigate to the directory where you saved `template.yaml`, and run the deployment command.

Since we are *updating* an existing stack definition (if you ran Exercise 2), the `aws cloudformation deploy` command is smart enough to detect changes and perform an update. If `EC2SimpleStack` doesn't exist, it will create it.

```bash
aws cloudformation deploy \
    --stack-name EC2SimpleStack \
    --template-file template.yaml \
    --capabilities CAPABILITY_IAM \
    --region us-east-1 \
    # Optional: If you want to specify your own SSH source IP, uncomment and replace:
    # --parameter-overrides SshLocation=YOUR_PUBLIC_IP_CIDR_HERE
```

#### What happens:

1.  CloudFormation will review your `template.yaml`.
2.  If the stack `EC2SimpleStack` already exists, it will detect that a new `AWS::EC2::SecurityGroup` resource has been added and that `MySimpleEC2Instance` has been modified.
3.  It will create the Security Group and then update the EC2 instance to attach this Security Group.
4.  Monitor the progress in the CloudFormation console until `UPDATE_COMPLETE` (or `CREATE_COMPLETE` if it's a fresh deployment).

-----

### Step 4: Verify the Security Group and EC2 Association

Once the stack status is `UPDATE_COMPLETE` (or `CREATE_COMPLETE`), you can verify the setup:

1.  **View Outputs via CLI:**

    ```bash
    aws cloudformation describe-stacks \
        --stack-name EC2SimpleStack \
        --query "Stacks[0].Outputs" \
        --output json \
        --region us-east-1
    ```

    You should now see the `SecurityGroupId` in the output, along with the EC2 instance details.

2.  **Check in AWS Console:**

      * Go to the **EC2 console** in your chosen region.
      * Navigate to **Instances** and find your `EC2SimpleStack-MySimpleEC2` instance.
      * Select the instance, and in the "Details" tab, under "Security," you should see the new Security Group (e.g., `EC2SimpleStack-SecurityGroup`) attached. Click on it.
      * In the Security Group details page, go to the "Inbound Rules" tab. You should see rules for TCP port 22 and TCP port 80, with their respective source IP ranges.

3.  **Test Connectivity (Optional):**

      * If you have an SSH key pair associated with the instance (which this template *doesn't* create, but you could add a `KeyName` property to `AWS::EC2::Instance`), you could try to SSH into the instance using its Public IP to confirm port 22 is open from your `SshLocation`.
      * You could also install a simple web server (like Nginx or Apache) on the EC2 instance and then try to access its Public IP in a web browser to confirm port 80 is open.

-----

### Step 5: Clean Up (Delete the Stack)

To avoid unwanted charges, delete the CloudFormation stack and all associated resources:

```bash
aws cloudformation delete-stack \
    --stack-name EC2SimpleStack \
    --region us-east-1
```

