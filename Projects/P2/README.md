# Manupulating AWS resources using CLI - Create two S3 buckets, Upload files in one bucket, Use CLI to copy from that bucket to the other ==>  [AWS CLI, S3]


This guide will walk you through the process of manipulating Amazon S3 (Simple Storage Service) resources using the AWS Command Line Interface (CLI). You'll learn how to create S3 buckets, upload files to one bucket, and then copy those files to another bucket, all from your terminal.

## Prerequisites
Before you begin, ensure you have the following:

- An AWS Account: If you don't have one, you can sign up for free at aws.amazon.com.

- AWS CLI Installed and Configured:

  - Installation: Follow the official AWS documentation for installing the AWS CLI on your operating system: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html

  - Configuration: Configure the AWS CLI with your access key ID, secret access key, default region, and output format. You can do this by running aws configure in your terminal and providing the necessary information.

```text
aws configure

```
(You can generate access keys in the AWS Management Console under "My Security Credentials" -> "Access keys").

## Step-by-Step Guide
### Step 1: Create Two S3 Buckets
We will create two S3 buckets. Remember that S3 bucket names must be globally unique. Choose names that are unlikely to be taken.

Replace your-unique-bucket-name-1 and your-unique-bucket-name-2 with your desired unique bucket names.

```text
# Create the first bucket
aws s3 mb s3://your-unique-bucket-name-1

# Create the second bucket
aws s3 mb s3://your-unique-bucket-name-2
```

#### Explanation:

- aws s3: The main command for interacting with S3.

- mb: Stands for "make bucket".

- s3://: Specifies the S3 protocol and the bucket name.

### Step 2: Create a Sample File to Upload
Before uploading, let's create a simple text file on your local machine.

```text
# On Linux/macOS
echo "This is a sample file for bucket 1." > sample-file-1.txt

# On Windows (Command Prompt)
echo This is a sample file for bucket 1. > sample-file-1.txt

# On Windows (PowerShell)
"This is a sample file for bucket 1." | Set-Content sample-file-1.txt

```

You can also create multiple files if you wish. For example:

```text
echo "Another file for bucket 1." > another-file-1.txt

```

### Step 3: Upload Files to the First Bucket
Now, let's upload the sample-file-1.txt (and another-file-1.txt if you created it) to your first S3 bucket.

```text
# Upload sample-file-1.txt
aws s3 cp sample-file-1.txt s3://your-unique-bucket-name-1/

# If you created another-file-1.txt, upload it too
aws s3 cp another-file-1.txt s3://your-unique-bucket-name-1/

```

#### Explanation:

- cp: Stands for "copy", used for copying local files to S3 or between S3 locations.

- The first argument is the path to your local file.

- The second argument is the S3 destination (bucket name followed by a forward slash / if you want it in the root of the bucket).


### Step 4: Verify Files in the First Bucket
You can list the contents of your first bucket to confirm the files were uploaded successfully.

```text
aws s3 ls s3://your-unique-bucket-name-1/
```

#### Explanation:

- ls: Stands for "list", used to list objects and common prefixes in an S3 bucket.


### Step 5: Copy Files from the First Bucket to the Second Bucket
Now, let's copy the files from your-unique-bucket-name-1 to your-unique-bucket-name-2 using the AWS CLI. We'll use the cp command again, but this time, both source and destination will be S3 paths.

#### Option A: Copying a specific file

```text
aws s3 cp s3://your-unique-bucket-name-1/sample-file-1.txt s3://your-unique-bucket-name-2/
```

#### Option B: Copying all files from one bucket to another (recursive)

This is often more efficient if you want to copy everything. The --recursive flag will copy all objects and subfolders.

```text
aws s3 cp s3://your-unique-bucket-name-1/ s3://your-unique-bucket-name-2/ --recursive
```

#### Explanation:

- cp: Used for copying.

- The first S3 path is the source bucket.

- The second S3 path is the destination bucket.

- --recursive: This flag is crucial for copying all contents (objects and prefixes/folders) from the source to the destination.

### Step 6: Verify Files in the Second Bucket
List the contents of your second bucket to ensure the files were copied correctly.

```text
aws s3 ls s3://your-unique-bucket-name-2/
```

You should see sample-file-1.txt (and another-file-1.txt if you copied it) in the output.

### Cleanup (Optional but Recommended)
It's good practice to clean up resources you no longer need to avoid incurring costs.

- 1.Delete files from both buckets:

```text
aws s3 rm s3://your-unique-bucket-name-1/sample-file-1.txt
aws s3 rm s3://your-unique-bucket-name-1/another-file-1.txt # If applicable
aws s3 rm s3://your-unique-bucket-name-2/sample-file-1.txt
aws s3 rm s3://your-unique-bucket-name-2/another-file-1.txt # If applicable
```

Alternatively, to delete all objects in a bucket recursively:

```text
aws s3 rm s3://your-unique-bucket-name-1/ --recursive
aws s3 rm s3://your-unique-bucket-name-2/ --recursive
```

- 2.Delete the S3 buckets:
(A bucket must be empty before it can be deleted.)

```text
aws s3 rb s3://your-unique-bucket-name-1
aws s3 rb s3://your-unique-bucket-name-2
```
#### Explanation:

- rb: Stands for "remove bucket".