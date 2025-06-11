# Packing Up & Restoring EC2 Servers

This guide outlines the steps to create an Amazon EC2 instance, populate it with data, create an Amazon Machine Image (AMI) from it, and then launch a new instance from that AMI to demonstrate data replication.

## Prerequisites
- An AWS Account

- AWS Management Console access or AWS CLI configured with appropriate permissions.

## Steps
### Step 1: Launch the Source EC2 Instance
- Navigate to EC2 Dashboard:

  - Log in to the AWS Management Console.

  - Search for "EC2" and navigate to the EC2 Dashboard.

- Launch Instance:

  - Click "Launch Instances."

  - Choose an Amazon Machine Image (AMI): Select a suitable AMI, e.g., "Amazon Linux 2023 AMI" or "Ubuntu Server 22.04 LTS."

  - Choose an Instance Type: Select a t2.micro or t3.micro for cost-effectiveness (eligible for free tier).

  - Key Pair: Create a new key pair or choose an existing one. You'll need this to SSH into the instance.

  - Network Settings: Ensure a security group is configured to allow SSH (port 22) access from your IP address or anywhere (0.0.0.0/0 for testing, but restrict in production).

  - Storage: Keep the default root volume size (e.g., 8 GiB).

  - Launch Instance: Review settings and click "Launch Instance."  

- Wait for Instance to be Running:

  - Go to the "Instances" view in the EC2 Dashboard.

  - Wait for the "Instance state" to become "Running" and "Status check" to pass (2/2 checks).  

### Step 2: Create a Text File Inside the Source Instance
- Connect to your EC2 Instance via SSH:

  - Get the Public IPv4 DNS or Public IPv4 address of your running instance from the EC2 Dashboard.

  - Open a terminal (Linux/macOS) or use an SSH client like PuTTY (Windows).

  - Navigate to the directory where your .pem key pair file is located.

  - Set appropriate permissions for your key file (if on Linux/macOS):  

  ```text
  chmod 400 your-key-pair.pem
  ```

  - Connect to the instance (replace your-key-pair.pem and ec2-user@your-instance-ip with your details):

    - For Amazon Linux:

    ```text
    ssh -i your-key-pair.pem ec2-user@YOUR_INSTANCE_PUBLIC_IP
    ```

    - For Ubuntu:
    ```text
    ssh -i your-key-pair.pem ubuntu@YOUR_INSTANCE_PUBLIC_IP
    ```

- Create and Save Text:

  - Once connected, create a new text file and add some content.    
```text
echo "This is a test message from the original EC2 instance." | sudo tee /home/ec2-user/my_replication_test.txt
# Or for Ubuntu:
# echo "This is a test message from the original EC2 instance." | sudo tee /home/ubuntu/my_replication_test.txt
```

  - Verify the content:

```text
cat /home/ec2-user/my_replication_test.txt
# Or for Ubuntu:
# cat /home/ubuntu/my_replication_test.txt
```

  - You can now exit the SSH session: exit


### Step 3: Create an AMI (Amazon Machine Image) from the Source Instance

- Select the Source Instance:

  - In the EC2 Dashboard, select the running source instance you just created.

- Create Image:

  - Go to Actions -> Image and templates -> Create image.

  - Image name: Provide a descriptive name, e.g., MySourceInstanceAMI.

  - Image description: Add a description, e.g., AMI created from MySourceInstance with replication test file.

  - No Reboot: (Optional but recommended for consistency) Check "No reboot" to ensure the instance doesn't reboot during image creation. This might lead to data inconsistency if applications are writing data, but it prevents downtime. For this simple test, it's fine.

  - Create image: Click "Create image."

- Monitor AMI Creation:

  - Navigate to AMIs under "Images" in the left navigation pane.

  - The status will initially be "pending" and then change to "available" once the AMI is successfully created. This can take several minutes.  

### Step 4: Launch a New EC2 Instance from the AMI
- Launch Instance from AMI:

  - From the "AMIs" view, select the AMI you just created.

  - Click "Launch instance from AMI."

- Configure New Instance:

  - Follow the same steps as in Step 1 for launching an instance (choose instance type, key pair, security group).

  - Important: Ensure you select the same key pair that you used for the original instance, as the new instance will inherit the original user and permissions.

  - Launch Instance: Review settings and click "Launch Instance."

- Wait for New Instance to be Running:

  - Go back to the "Instances" view.

  - Wait for the new instance (launched from your AMI) to be "Running" and "Status check" to pass.  

### Step 5: Verify the Text File in the New Instance
- Connect to the New EC2 Instance via SSH:

  - Get the Public IPv4 DNS or Public IPv4 address of the new instance.

  - Use the same key pair you used for the original instance.

  - Connect via SSH, similar to Step 2.

    - For Amazon Linux:  

```text
ssh -i your-key-pair.pem ec2-user@YOUR_NEW_INSTANCE_PUBLIC_IP
```

    - For Ubuntu:
```text
ssh -i your-key-pair.pem ubuntu@YOUR_NEW_INSTANCE_PUBLIC_IP
```

 - Check for the Text File:

    - Once connected, navigate to the directory where you created the file and list its contents:

```text
ls -l /home/ec2-user/
# Or for Ubuntu:
# ls -l /home/ubuntu/
```

    - You should see my_replication_test.txt.

    - Now, view the content of the file:

```text
cat /home/ec2-user/my_replication_test.txt
# Or for Ubuntu:
# cat /home/ubuntu/my_replication_test.txt
```

    - You should observe the text: "This is a test message from the original EC2 instance."

#### Step 6: Clean Up (Important!)
To avoid incurring unnecessary AWS costs, terminate both EC2 instances and deregister the AMI.    

- Terminate EC2 Instances:
  
  - Go to "Instances" in the EC2 Dashboard.

  - Select both your source and new instances.

  - Go to Instance state -> Terminate instance.

  - Confirm termination.

- Deregister AMI:

  - Go to "AMIs" under "Images."

  - Select your custom AMI (MySourceInstanceAMI).

  - Go to Actions -> Deregister AMI.

  - Confirm deregistration.

  - Important: Deregistering an AMI does not delete the snapshots that back it. You must also manually delete the associated snapshots. Go to "Snapshots" under "Elastic Block Store." Select the snapshot(s) associated with your AMI (you can identify them by their description, which often links back to the AMI) and choose Actions -> Delete snapshot.    

  By following these steps, you will have successfully demonstrated the process of backing up an EC2 instance's state (including its file system) using an AMI and restoring it to a new instance.