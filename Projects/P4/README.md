
## 🚀 Deploying a High Availability (HA) Web Server with ALB + EC2 (Beginner Level)

Welcome to a practical project that will help you get familiar with AWS\! Here's a step-by-step guide to deploying a highly available web server system.


## 🎯 Objective
Build a highly available website by evenly distributing traffic across multiple EC2 instances using an **Application Load Balancer (ALB)**.

## 📘 Skills Gained
- Fundamentals of **Application Load Balancer (ALB)**: listener, target group, health check.
- EC2 **Auto Scaling** configuration.
- *(Optional)* Using **Route 53** to assign a custom domain.

## 🛠️ Technologies & AWS Services
- **EC2**
- **Application Load Balancer (ALB)**
- **Auto Scaling Group**
- **Launch Template**
- **Security Group**
- *(Optional)* **Route 53**

## 📝 Description

1. Launch **2 EC2 instances** (with Nginx or Apache web servers installed).
2. Configure an **Application Load Balancer** to distribute incoming traffic to the EC2 instances.
3. Set up an **Auto Scaling Group** to ensure a minimum of 2 instances are always running.
4. *(Optional)* Assign a custom domain to the ALB using **Route 53**.

---



### 📝 Overview of Steps:
<div style="background-color: #f0f8ff; padding: 10px; border-radius: 8px;">
1.  **Preparation:** Log in to the AWS Console, select a Region.
2.  **Create Security Groups:** Allow HTTP/HTTPS access to EC2 and ALB.
3.  **Create Launch Template:** Define EC2 instance configuration (AMI, instance type, web server installation script).
4.  **Create Application Load Balancer (ALB):** Configure the ALB and its Listeners.
5.  **Create Target Group:** Define where the ALB will send traffic.
6.  **Create Auto Scaling Group:** Ensure a minimum number of running instances and automatically replace faulty ones.
7.  **Test:** Access the website via the ALB DNS.
8.  **(Optional) Configure Route 53:** Map a custom domain to the ALB.
9.  **Clean Up Resources:** Delete the created resources.
</div>
-----

### 🛠️ Let's Start Deploying:

#### Step 1: ⚙️ Preparation

  * **Log in to AWS Management Console:** Go to [https://aws.amazon.com/console/](https://aws.amazon.com/console/) and log in with your AWS account.
  * **Choose a Region:** Select a Region closest to you (e.g., Singapore `ap-southeast-1`, North Virginia `us-east-1`, etc.). This is important because all resources you create will reside in this Region.

#### Step 2: 🔐 Create Security Groups

We'll need two **Security Groups**: one for the **ALB** and one for the **EC2 instances**.

  * **Security Group for EC2 Instances:**

    1.  In the AWS Console, search for "**EC2**" and click it.
    2.  In the left-hand menu, under "Network & Security", click "**Security Groups**".
    3.  Click "**Create security group**".
    4.  **Security group name:** `web-server-sg`
    5.  **Description:** `Allow HTTP/HTTPS traffic to web servers`
    6.  **VPC:** Select your default VPC (or the VPC you wish to use).
    7.  **Inbound rules:**
          * Click "**Add rule**".
          * **Type:** `HTTP`
          * **Source:** `Custom` -\> `web-alb-sg` (We'll create this SG later, but we're defining that EC2 only receives traffic from the ALB) or `Anywhere` if you want to test directly via public IP (not recommended for production).
          * Click "**Add rule**" again.
          * **Type:** `HTTPS`
          * **Source:** `Custom` -\> `web-alb-sg` or `Anywhere`.
          * Click "**Add rule**" again.
          * **Type:** `SSH`
          * **Source:** `My IP` (so you can SSH into instances for testing or debugging).
    8.  **Outbound rules:** Keep default (Allow all traffic).
    9.  Click "**Create security group**".

  * **Security Group for ALB:**

    1.  Click "**Create security group**" again.
    2.  **Security group name:** `web-alb-sg`
    3.  **Description:** `Allow HTTP/HTTPS traffic to ALB`
    4.  **VPC:** Select the same VPC as the EC2 SG.
    5.  **Inbound rules:**
          * Click "**Add rule**".
          * **Type:** `HTTP`
          * **Source:** `Anywhere-IPv4` (`0.0.0.0/0`)
          * Click "**Add rule**" again.
          * **Type:** `HTTPS`
          * **Source:** `Anywhere-IPv4` (`0.0.0.0/0`)
    6.  **Outbound rules:** Keep default.
    7.  Click "**Create security group**".

#### Step 3: 🚀 Create Launch Template

A **Launch Template** defines how **EC2 instances** will be configured when an **Auto Scaling Group** launches them.

1.  In the EC2 menu, under "Instances", click "**Launch Templates**".

2.  Click "**Create launch template**".

3.  **Launch template name:** `web-server-template`

4.  **Template version description:** `Initial version`

5.  **Auto Scaling guidance:** Select "Provide guidance to help me create a template that Auto Scaling can use to launch instances."

6.  **Amazon Machine Image (AMI):**

      * Click "Browse more AMIs".
      * Search for an Amazon Linux 2 AMI (e.g., `Amazon Linux 2023 AMI`). Select the latest version.

7.  **Instance type:** Select `t2.micro` (sufficient for this project and falls within the Free Tier).

8.  **Key pair (login):** Choose an existing Key Pair, or create a new one if you don't have one. You'll need this Key Pair to SSH into instances if required.

9.  **Network settings:**

      * **Security groups:** Find and select `web-server-sg` that you created.
      * **Subnet:** **Do not select a specific subnet here.** The Auto Scaling Group will determine the subnet based on the VPC and Availability Zones you choose.

10. **Advanced details:** Scroll down to the "**User data**" section. This is where you'll place the script to install the web server when the instance starts.

      * Paste one of the following scripts (choose Nginx or Apache):

    **Script for Nginx:**

    ```bash
    #!/bin/bash
    yum update -y
    amazon-linux-extras install nginx1 -y
    systemctl start nginx
    systemctl enable nginx
    echo "<h1>Hello from Nginx on $(hostname -f)</h1>" > /usr/share/nginx/html/index.html
    ```

    **Script for Apache (httpd):**

    ```bash
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Hello from Apache on $(hostname -f)</h1>" > /var/www/html/index.html
    ```

    *Note:* Choose only one of the scripts above. I recommend Nginx for this project.

11. Click "**Create launch template**".

#### Step 4: ⚖️ Create Application Load Balancer (ALB)

1.  In the EC2 menu, under "Load Balancing", click "**Load Balancers**".
2.  Click "**Create Load Balancer**".
3.  Choose "**Application Load Balancer**" and click "**Create**".
4.  **Load balancer name:** `web-alb`
5.  **Scheme:** `Internet-facing`
6.  **IP address type:** `IPv4`
7.  **VPC:** Select the same VPC as your **Security Groups**.
8.  **Mappings:** Select at least **2 Availability Zones** and the **public Subnets** within each of those AZs. This is crucial for **high availability**.
9.  **Security groups:** Select the `web-alb-sg` that you created.
10. **Listeners and routing:**
      * **Protocol:** `HTTP`
      * **Port:** `80`
      * **Default action:** `Forward to` -\> we'll create the **Target Group** in the next step, so leave this blank or select `Create target group` (but we'll create it separately).
11. Click "**Create load balancer**". You'll see a message that the Load Balancer was successfully created, but it can't forward traffic until a Target Group is configured.

#### Step 5: 🎯 Create Target Group

A **Target Group** is where the **ALB** will send requests.

1.  In the EC2 menu, under "Load Balancing", click "**Target Groups**".
2.  Click "**Create target group**".
3.  **Choose a target type:** `Instances`
4.  **Target group name:** `web-servers-tg`
5.  **Protocol:** `HTTP`
6.  **Port:** `80`
7.  **VPC:** Select the same VPC.
8.  **Health checks:**
      * **Protocol:** `HTTP`
      * **Path:** `/` (to check the home page)
      * Keep other default settings or adjust if needed (e.g., `Healthy threshold`, `Unhealthy threshold`, `Timeout`, `Interval`).
9.  Click "**Next**".
10. **Register targets:** No need to register any instances here. The **Auto Scaling Group** will automatically register instances to this **Target Group**.
11. Click "**Create target group**".

**Return to ALB configuration:**

Now that you have a **Target Group**, go back to your **ALB** and configure its **Listeners** to point to this **Target Group**.

1.  In the EC2 menu, under "Load Balancing", click "**Load Balancers**".
2.  Select `web-alb`.
3.  Click the "**Listeners**" tab.
4.  Select the **HTTP:80 Listener**. Click "**Actions**" -\> "**Edit listener**".
5.  Under "Default actions", click "**Add action**" -\> "**Forward to**".
6.  Select `web-servers-tg` from the **Target Group** list.
7.  Click "**Update**".

#### Step 6: 📈 Create Auto Scaling Group

The **Auto Scaling Group** will ensure you always have a minimum number of running instances and will automatically replace any failed or terminated instances.

1.  In the EC2 menu, under "Auto Scaling", click "**Auto Scaling Groups**".
2.  Click "**Create Auto Scaling group**".
3.  **Auto Scaling group name:** `web-asg`
4.  **Launch template:** Select the `web-server-template` you created.
5.  Click "**Next**".
6.  **Network:**
      * **VPC:** Select the same VPC.
      * **Availability Zones and subnets:** Select all **public Subnets** in the **Availability Zones** that you selected for your **ALB**. **This is crucial.**
7.  **Load balancing:**
      * Choose "Attach to an existing load balancer".
      * **Choose from your load balancer target groups:** Select `web-servers-tg`.
8.  **Health checks:**
      * **Health check type:** `ELB` (so the ASG uses health check results from the ALB).
      * **Health check grace period:** `300` (seconds, to allow the instance to start and the web server to run).
9.  Click "**Next**".
10. **Configure group size and scaling policies:**
      * **Desired capacity:** `2` (the number of instances you want)
      * **Minimum capacity:** `2` (the minimum number of instances)
      * **Maximum capacity:** `4` (the maximum allowed instances for scaling)
11. **Scaling policies:** You can set up scaling policies based on CPU Utilization or other metrics, but for this project, we'll skip this for simplicity.
12. Click "**Next**".
13. **Add notifications (optional):** Skip.
14. **Add tags (optional):** It's a good idea to add tags for easier management, e.g., `Key: Name`, `Value: WebServer`.
15. Click "**Next**".
16. Review the configuration and click "**Create Auto Scaling group**".

After creating the **ASG**, AWS will start launching your 2 **EC2 instances**. You can check their status under "**Instances**" in EC2.

#### Step 7: ✅ Test

1.  In the EC2 menu, under "Load Balancing", click "**Load Balancers**".
2.  Select `web-alb`.
3.  Find the ALB's "**DNS name**" (e.g., `web-alb-1234567890.us-east-1.elb.amazonaws.com`).
4.  Open a web browser and paste this DNS name.
5.  You should see the "Hello from Nginx on..." (or Apache) webpage, and the hostname will change as you refresh, indicating the **ALB** is distributing traffic between instances.

**Test High Availability:**

  * **Terminate an instance:**
    1.  Go to the "**Instances**" section of EC2.
    2.  Select one of the two instances launched by `web-asg`.
    3.  Click "**Instance state**" -\> "**Terminate instance**".
    4.  Observe the **Auto Scaling Group**. After a few minutes, the **ASG** will detect that an instance has been terminated and will automatically launch a new one to maintain the "Desired capacity" of 2.
    5.  Refresh your webpage. It should still be working normally\!

-----

#### Step 8: 🌐 (Optional) Configure Route 53 for Domain Mapping

To use your custom domain (e.g., `mywebsite.com`) instead of the **ALB's DNS name**:

1.  **Register a domain:** If you don't have one, register a domain through **Route 53** or another domain provider. If you already have one, ensure that your domain's nameservers are pointed to **Route 53** (if you're managing DNS through Route 53).
2.  In the AWS Console, search for "**Route 53**" and click it.
3.  In the left-hand menu, under "DNS management", click "**Hosted zones**".
4.  Select the **Hosted Zone** for your domain (e.g., `mywebsite.com`). If you don't have one, click "**Create hosted zone**" and follow the instructions.
5.  Click "**Create record**".
6.  **Record name:** Leave blank (if you want to point the root domain `mywebsite.com`) or enter `www` (to point `www.mywebsite.com`).
7.  **Record type:** `A - Routes traffic to an IPv4 address and some AWS resources`
8.  **Alias:** Turn on "Alias".
9.  **Route traffic to:** Choose "Alias to Application and Classic Load Balancer".
      * **Region:** Select the Region where your **ALB** is located.
      * **Choose Load Balancer:** Select `web-alb`.
10. **Routing policy:** `Simple routing`
11. Click "**Create records**".

Now, you can access your website using your custom domain (e.g., `http://mywebsite.com` or `http://www.mywebsite.com`).

-----

#### Step 9: 🗑️ Clean Up Resources

To avoid incurring unnecessary costs, clean up the resources you created after completing the project.

1.  **Delete Auto Scaling Group:**

      * In **Route 53**, delete the Record you created for the **ALB**.
      * In the AWS Console, go to "EC2" -\> "**Auto Scaling Groups**".
      * Select `web-asg`.
      * Click "**Delete**". This will terminate all **EC2 instances** created by the **ASG**.

2.  **Delete Application Load Balancer:**

      * In the AWS Console, go to "EC2" -\> "**Load Balancers**".
      * Select `web-alb`.
      * Click "**Actions**" -\> "**Delete load balancer**".

3.  **Delete Target Group:**

      * In the AWS Console, go to "EC2" -\> "**Target Groups**".
      * Select `web-servers-tg`.
      * Click "**Actions**" -\> "**Delete**".

4.  **Delete Launch Template:**

      * In the AWS Console, go to "EC2" -\> "**Launch Templates**".
      * Select `web-server-template`.
      * Click "**Actions**" -\> "**Delete launch template**".

5.  **Delete Security Groups:**

      * In the AWS Console, go to "EC2" -\> "**Security Groups**".
      * Select `web-server-sg` and `web-alb-sg`.
      * Click "**Actions**" -\> "**Delete security group**". (You might need to delete the ALB SG first, then the EC2 SG if there are dependency errors).

