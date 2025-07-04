----

### Requirement

Lesson 4. Output, Metadata and Mappings
Use Mappings to select AMI by region.

Use Metadata to describe resources.

Add Outputs such as EC2 Public IP.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: |
  This template demonstrates the use of Mappings for AMI selection,
  Metadata for resource description, and Outputs for EC2 Public IP.

Metadata:
  Project: CloudFormation Learning
  Lesson: 4 - Output, Metadata, Mappings
  Author: Gemini AI
  Purpose: To showcase advanced CloudFormation features for educational purposes.

Mappings:
  RegionMap:
    us-east-1:
      AMI: ami-053b0d53cd71158ed # Example AMI for us-east-1 (Amazon Linux 2023 HVM kernel-6.1)
    us-west-2:
      AMI: ami-0d8b440e6900f34de # Example AMI for us-west-2 (Amazon Linux 2023 HVM kernel-6.1)
    eu-west-1:
      AMI: ami-0b190f8dd7881c15f # Example AMI for eu-west-1 (Amazon Linux 2023 HVM kernel-6.1)
    ap-southeast-1:
      AMI: ami-0c46b5a7cf95e5482 # Example AMI for ap-southeast-1 (Amazon Linux 2023 HVM kernel-6.1)
    ap-northeast-1:
      AMI: ami-090c21e3f8902ad1c # Example AMI for ap-northeast-1 (Amazon Linux 2023 HVM kernel-6.1)

Resources:
  MyEC2Instance:
    Type: AWS::EC2::Instance
    Metadata:
      Description: This EC2 instance is created to demonstrate CloudFormation features.
      Purpose: Hosting a simple web server or for general compute tasks.
      Environment: Development
    Properties:
      ImageId: !FindInMap [RegionMap, !Ref "AWS::Region", AMI]
      InstanceType: t2.micro
      Tags:
        - Key: Name
          Value: MyCloudFormationInstance

Outputs:
  InstancePublicIp:
    Description: The Public IP address of the EC2 instance.
    Value: !GetAtt MyEC2Instance.PublicIp
  InstanceId:
    Description: The ID of the EC2 instance.
    Value: !Ref MyEC2Instance

```

-----

### Explanation of the CloudFormation Template

  * **`AWSTemplateFormatVersion`**: Specifies the CloudFormation template format version.
  * **`Description`**: A high-level description of what the template does.
  * **`Metadata`**:
      * This section at the top level provides **metadata for the entire template**. Here, it describes the project, lesson, author, and purpose of the template.
      * **Resource-level `Metadata`**: The `MyEC2Instance` resource also has its own `Metadata` section. This is useful for providing specific details or documentation about that particular resource directly within the template. This information can be viewed in the CloudFormation console when inspecting the stack or resources.
  * **`Mappings`**:
      * The `RegionMap` is a mapping that allows you to select an appropriate **Amazon Machine Image (AMI)** based on the AWS region where the stack is being deployed.
      * **How it works**: When CloudFormation processes the template, it looks up the current region (using `!Ref "AWS::Region"`) in the `RegionMap` and then retrieves the `AMI` value associated with that region. This makes your template more portable across different AWS regions.
      * **Important Note**: The AMIs provided are example Amazon Linux 2023 AMIs. You should always verify and use the latest and correct AMIs for your specific region and operating system requirements.
  * **`Resources`**:
      * **`MyEC2Instance`**: This defines an EC2 instance.
      * **`Type: AWS::EC2::Instance`**: Specifies that this is an EC2 instance resource.
      * **`Properties`**:
          * **`ImageId`**: This is where the `!FindInMap` intrinsic function is used. It tells CloudFormation to look up the `AMI` value in the `RegionMap` using the current AWS region.
          * **`InstanceType`**: Sets the instance type to `t2.micro`.
          * **`Tags`**: Applies a tag with the key `Name` and value `MyCloudFormationInstance` to the EC2 instance for easy identification.
  * **`Outputs`**:
      * The `Outputs` section allows you to **export specific values from your stack** that you might want to easily retrieve or use in other CloudFormation stacks (using `Fn::ImportValue`).
      * **`InstancePublicIp`**:
          * **`Description`**: Provides a clear explanation of what this output represents.
          * **`Value: !GetAtt MyEC2Instance.PublicIp`**: Uses the `!GetAtt` intrinsic function to retrieve the `PublicIp` attribute of the `MyEC2Instance` resource. This will display the public IP address of the EC2 instance after the stack is created.
      * **`InstanceId`**:
          * **`Description`**: Describes the output.
          * **`Value: !Ref MyEC2Instance`**: Uses the `!Ref` intrinsic function to retrieve the physical ID (Instance ID) of the `MyEC2Instance` resource.

