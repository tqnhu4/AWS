
# Deploying a WordPress Server on EC2 (Tech stack: EC2, Linux, MySQL, IAM Security Groups)
This project will walk you through setting up a WordPress instance on an Amazon EC2 virtual machine. We'll cover the necessary components including launching the EC2 instance, configuring the Linux operating system, installing MySQL and WordPress, and securing your setup with IAM Security Groups.

## Tech Stack Overview
- EC2 (Elastic Compute Cloud): Amazon's scalable virtual servers that provide resizable compute capacity in the cloud.
- Linux: The operating system we'll use for our EC2 instance (e.g., Amazon Linux 2, Ubuntu).
- MySQL: The relational database management system that WordPress uses to store its data.
- IAM Security Groups: Virtual firewalls for your EC2 instances to control inbound and outbound traffic.


## Project Steps
## Step 1: Launch an EC2 Instance

- Log in to AWS Management Console: Go to https://aws.amazon.com/ and sign in to your account.
- Navigate to EC2: In the search bar, type "EC2" and select "EC2" under Services.
- Launch Instance: Click on "Launch instances".
- Choose an Amazon Machine Image (AMI):
  - For this tutorial, let's use Amazon Linux 2 AMI. It's free tier eligible and optimized for AWS.
  - Alternatively, you could choose Ubuntu Server.
- Choose an Instance Type:
  - Select t2.micro (free tier eligible). This is sufficient for a basic WordPress site.
- Configure Instance Details:
  - Most default settings are fine.
  - You might want to put your instance in a specific VPC and Subnet if you have a custom network setup. For a simple deployment,   - default VPC and subnet are fine.
  - Enable auto-assign public IP if it's not already enabled, as we'll need a public IP to access our server.
- Add Storage:
  - The default 8 GiB General Purpose SSD (gp2) is usually enough. You can increase it if needed.
- Add Tags (Optional but Recommended):
  - Add a tag with "Key: Name", "Value: WordPress-Server". This helps identify your instance.

- Configure Security Group:
  - This is crucial for security.
  - Click "Create a new security group".
  - Security group name: wordpress-sg
  - Description: Security group for WordPress server
  - Add Rules:
    - Type: SSH, Source: My IP (or Anywhere for testing, but My IP is more secure). This allows you to connect to your instance via SSH.
    - Type: HTTP, Source: Anywhere. This allows web traffic (port 80) to reach your WordPress site.
    - Type: HTTPS, Source: Anywhere. This allows secure web traffic (port 443) to reach your WordPress site (we'll enable HTTPS later, but it's good to open the port now).
- Review and Launch:
Review your settings.
  - Click "Launch".
  - Create a new key pair: Give it a name (e.g., wordpress-keypair) and download the .pem file. Keep this file safe! You'll need it to connect to your instance.
  - Click "Launch Instances".  

## Step 2: Connect to Your EC2 Instance via SSH
- Locate your .pem file: Ensure the .pem file you downloaded has the correct permissions (read-only for the owner).
chmod 400 wordpress-keypair.pem
- Get your EC2 Instance Public IP/DNS: In the EC2 Dashboard, select your running instance and note its "Public IPv4 DNS" or "Public IPv4 address".
- Connect using SSH: Open a terminal or command prompt and use the following command:

```bash
ssh -i /path/to/your/wordpress-keypair.pem ec2-user@YOUR_EC2_PUBLIC_IP_OR_DNS
```

  - Replace /path/to/your/wordpress-keypair.pem with the actual path to your key pair file.
  - Replace YOUR_EC2_PUBLIC_IP_OR_DNS with your instance's public IP address or DNS name.
  - If you chose Ubuntu, the user would be ubuntu instead of ec2-user.

## Step 3: Install Apache, MySQL, and PHP (LAMP Stack)
Once connected, run the following commands to install the necessary software.

## For Amazon Linux 2:

- Update packages:  
```bash
sudo yum update -y
```

- Install Apache, MySQL, and PHP:

```bash
sudo yum install -y httpd php php-mysqlnd mysql-server
```
  - httpd is Apache.
  - php is PHP.
  - php-mysqlnd is the MySQL native driver for PHP.
  - mysql-server is the MySQL database server.


- Start Apache and enable it to start on boot:

```bash
sudo systemctl start httpd
sudo systemctl enable httpd
```

- Start MySQL and enable it to start on boot:

```bash
sudo systemctl start mysqld
sudo systemctl enable mysqld
```

- Secure MySQL Installation:

  - Run the MySQL secure installation script. Follow the prompts to set a root password, remove anonymous users, disallow remote root login, and remove the test database.
```bash
sudo mysql_secure_installation
```

## Step 4: Install WordPress

- Download WordPress:

```bash
cd /var/www/html
sudo wget https://wordpress.org/latest.tar.gz
```

- Extract WordPress:

```bash
sudo tar -xzf latest.tar.gz
```
- Move WordPress files:

```bash
sudo mv wordpress/* .
```

- Clean up:

```bash
sudo rm latest.tar.gz
sudo rm -r wordpress
```

- Set correct permissions for WordPress files:

```bash
sudo chown -R apache:apache /var/www/html
sudo chmod -R 775 /var/www/html
```

## Step 5: Create a MySQL Database and User for WordPress

- Log in to MySQL as root:

```bash

sudo mysql -u root -p
```

  - Enter the root password you set during mysql_secure_installation.

- Create a database for WordPress:

```bash
CREATE DATABASE wordpress_db;
```
  - You can choose any name for your database.

- Create a MySQL user and grant privileges to the database:

```sql
CREATE USER 'wordpress_user'@'localhost' IDENTIFIED BY 'YOUR_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON wordpress_db.* TO 'wordpress_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```
  - Replace wordpress_user with your desired username.
  - Replace YOUR_STRONG_PASSWORD with a strong, unique password for your WordPress user.

## Step 6: Configure WordPress
- Create WordPress configuration file:  

```bash

sudo cp /var/www/html/wp-config-sample.php /var/www/html/wp-config.php

```
- Edit wp-config.php:

```bash
sudo nano /var/www/html/wp-config.php
```
  - Find the following lines and update them with your database details:

```php
define( 'DB_NAME', 'wordpress_db' ); // Your database name
define( 'DB_USER', 'wordpress_user' ); // Your MySQL user
define( 'DB_PASSWORD', 'YOUR_STRONG_PASSWORD' ); // Your MySQL user password
define( 'DB_HOST', 'localhost' ); // MySQL host
```

  - Save the file (Ctrl+O, Enter, Ctrl+X).

## Step 7: Access Your WordPress Site

- Open your web browser:
- Enter your EC2 instance's Public IP address or Public DNS name.
  - http://YOUR_EC2_PUBLIC_IP_OR_DNS
- You should now see the WordPress installation wizard. Follow the on-screen instructions to complete the setup (site title, admin username, password, email).

## Security Considerations (IAM Security Groups and Beyond)
- Security Groups:
  - We've already configured basic security groups (SSH from your IP, HTTP/HTTPS from Anywhere).
  - Best Practice: Restrict SSH access to only your known IP addresses. If your IP changes, update the security group.
  - Consider creating separate security groups for web servers and database servers in more complex setups.
- IAM Roles (for advanced scenarios): While not strictly required for this basic setup, for production environments, avoid storing AWS credentials directly on your EC2 instance. Instead, use IAM Roles to grant your EC2 instance permissions to interact with other AWS services (e.g., S3 for media storage, CloudWatch for logging).
- Updates: Regularly update your operating system and WordPress:
  - sudo yum update -y (for Amazon Linux 2)
  - Update WordPress core, themes, and plugins from the WordPress dashboard.
- HTTPS (SSL/TLS):
  - For a production site, always enable HTTPS. You can do this by:
  - Using AWS Certificate Manager (ACM) to provision a free SSL/TLS certificate and integrate it with an Application Load Balancer (ALB) in front of your EC2 instance.
  - Using Let's Encrypt with Certbot directly on your EC2 instance (requires opening port 443 in your security group).
- Backups: Implement a backup strategy for your WordPress site (database and files).
  - AWS offers services like Amazon RDS (for managed databases) and AWS Backup.
  - Third-party WordPress backup plugins.
- Monitoring: Set up Amazon CloudWatch alarms to monitor your instance's health, CPU utilization, and disk usage.

This comprehensive guide should get your WordPress server up and running on EC2! Remember to prioritize security and regular maintenance for any production environment.