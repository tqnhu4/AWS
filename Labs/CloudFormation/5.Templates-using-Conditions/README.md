
-----
### Requirement

Lesson 5. Templates using Conditions
Use Conditions to create resources only if a flag is enabled by the user.

For example, only create RDS if CreateDatabase=true.


```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: |
  This template demonstrates the use of CloudFormation Conditions
  to conditionally create an RDS database instance based on a user-defined parameter.

Parameters:
  CreateDatabase:
    Type: String
    Default: 'false'
    AllowedValues:
      - 'true'
      - 'false'
    Description: Set to 'true' to create an RDS database instance.

Conditions:
  ShouldCreateDatabase: !Equals [!Ref CreateDatabase, 'true']

Resources:
  MyEC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: ami-053b0d53cd71158ed # Example AMI for us-east-1 (Amazon Linux 2023 HVM kernel-6.1)
      InstanceType: t2.micro
      Tags:
        - Key: Name
          Value: MyConditionalEC2Instance

  MyDBInstance:
    Type: AWS::RDS::DBInstance
    Condition: ShouldCreateDatabase
    Properties:
      DBName: mydatabase
      Engine: mysql
      MasterUsername: admin
      MasterUserPassword: mysecurepassword # Consider using AWS Secrets Manager for production
      DBInstanceClass: db.t2.micro
      AllocatedStorage: '20'
      MultiAZ: 'false' # Set to 'true' for high availability in production
      StorageType: gp2
      Tags:
        - Key: Name
          Value: MyConditionalDBInstance

Outputs:
  EC2InstanceId:
    Description: The ID of the EC2 instance.
    Value: !Ref MyEC2Instance
  
  # Only output DB endpoint if the database was created
  DBEndpointAddress:
    Description: The address of the RDS database endpoint.
    Value: !If
      - ShouldCreateDatabase
      - !GetAtt MyDBInstance.Endpoint.Address
      - 'N/A - Database not created'
```

-----

### Explanation of the CloudFormation Template

  * **`AWSTemplateFormatVersion`**: Specifies the CloudFormation template format version.
  * **`Description`**: A high-level description of what the template does.

-----

### Parameters

  * **`CreateDatabase`**: This is a user-defined input parameter.
      * **`Type: String`**: It expects a string value.
      * **`Default: 'false'`**: By default, the database will not be created unless the user explicitly changes this.
      * **`AllowedValues: ['true', 'false']`**: Restricts the user's input to either 'true' or 'false'.
      * **`Description`**: Provides instructions to the user on how to use this parameter.

-----

### Conditions

  * **`ShouldCreateDatabase`**: This is where the core logic for conditional creation lives.
      * **`!Equals [!Ref CreateDatabase, 'true']`**: This intrinsic function checks if the value of the `CreateDatabase` parameter is exactly equal to the string `'true'`.
      * If this condition evaluates to `true`, any resource with `Condition: ShouldCreateDatabase` will be created. If it evaluates to `false`, those resources will be skipped.

-----

### Resources

  * **`MyEC2Instance`**:
      * This is a standard EC2 instance, included here to show that some resources will *always* be created, regardless of the condition. It doesn't have a `Condition` property.
      * **`ImageId`**: An example AMI ID (ensure you replace this with an appropriate AMI for your region and needs).
      * **`InstanceType`**: Sets the instance type.
  * **`MyDBInstance`**:
      * **`Type: AWS::RDS::DBInstance`**: Defines an RDS database instance.
      * **`Condition: ShouldCreateDatabase`**: This is the crucial part. This line tells CloudFormation to **only create this `MyDBInstance` resource if the `ShouldCreateDatabase` condition evaluates to `true`**. If `CreateDatabase` parameter is 'false', this database resource will be completely ignored during stack creation or update.
      * **`Properties`**: Standard RDS configuration like `DBName`, `Engine`, `MasterUsername`, `MasterUserPassword`, etc.
          * **Security Note**: For production environments, you should **never hardcode passwords** in your CloudFormation templates. Instead, use a secure method like AWS Secrets Manager or KMS-encrypted parameters in Systems Manager Parameter Store.

-----

### Outputs

  * **`EC2InstanceId`**: This output will always be available since the EC2 instance is always created.
  * **`DBEndpointAddress`**:
      * **Conditional Output**: This output uses the `!If` intrinsic function to conditionally display the database endpoint.
      * **`!If [ShouldCreateDatabase, !GetAtt MyDBInstance.Endpoint.Address, 'N/A - Database not created']`**:
          * If `ShouldCreateDatabase` is `true` (meaning the database was created), it will output the actual `Endpoint.Address` of the `MyDBInstance`.
          * If `ShouldCreateDatabase` is `false` (meaning the database was *not* created), it will output the string `'N/A - Database not created'`. This prevents errors if you try to get an attribute from a resource that wasn't created.

-----

### How to Use This Template

1.  **Save the code** as a `.yaml` file (e.g., `conditional-rds.yaml`).
2.  **Deploy using AWS CloudFormation**:
      * Open the CloudFormation console.
      * Choose "Create stack" -\> "With new resources (standard)".
      * Upload your template file.
      * On the "Specify stack details" page, you'll see the **`CreateDatabase` parameter**.
          * If you leave it as `'false'` (the default), only the EC2 instance will be created.
          * If you change it to `'true'`, both the EC2 instance and the RDS database will be created.

