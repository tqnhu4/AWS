---
## Microservices Infrastructure with ALB + ECS Fargate

This project guides you through deploying a microservices architecture on AWS using ECS Fargate, with an Application Load Balancer (ALB) to route traffic based on URL paths.

### Learning Objectives 🧠

By completing this project, you will gain hands-on experience with:

* **ECS Fargate and Docker on AWS**: Understanding how to deploy and manage containerized applications without managing underlying servers.
* **ALB with Path-Based Routing**: Configuring an ALB to direct incoming requests to different microservices based on their URL paths (e.g., `/auth`, `/orders`, `/products`).
* **IAM for ECS**: Setting up appropriate Identity and Access Management (IAM) roles for ECS tasks and services.
* **Logging with CloudWatch**: Integrating CloudWatch for centralized logging of your microservices.

### Technologies & Services Used 🛠️

* **Amazon Elastic Container Service (ECS) Fargate**: Serverless compute for containers.
* **Amazon Elastic Container Registry (ECR)**: Managed Docker container image registry.
* **Application Load Balancer (ALB)**: Layer 7 load balancer for HTTP/HTTPS traffic.
* **AWS Identity and Access Management (IAM)**: Manages access to AWS services and resources.
* **Amazon CloudWatch**: Monitoring and observability service.
* **Amazon Virtual Private Cloud (VPC)**: Logically isolated section of the AWS Cloud.

### Project Description 📝

You will set up an infrastructure that supports three distinct microservices: `auth`, `order`, and `product`. Each service will run as an independent ECS Fargate service, and an ALB will handle the routing of requests to the correct service based on the URL path.

**High-Level Steps:**

1.  **Build and Push Docker Images**: Create Docker images for your `auth`, `order`, and `product` services and push them to ECR.
2.  **Deploy ECS Fargate Services**: Deploy each of the three services as a separate ECS Fargate service within a common ECS cluster.
3.  **Configure ALB with Path Rules**: Set up an ALB with listeners and target groups, and define path-based routing rules to direct traffic:
    * `/auth/*` goes to the **Auth Service**
    * `/orders/*` goes to the **Order Service**
    * `/products/*` goes to the **Product Service**
4.  **Enable CloudWatch Logging**: Ensure that logs from your ECS tasks are sent to CloudWatch for monitoring and debugging.

---

### Step-by-Step Guide 🚀

#### 1. Prepare Your Microservices and Push to ECR 🐳

For this project, you'll need three simple web applications that respond to HTTP requests. For demonstration purposes, they can be basic "Hello World" applications that indicate which service they are (e.g., "Hello from Auth Service").

1.  **Create Dockerfiles:** For each service (e.g., `auth`, `order`, `product`), create a `Dockerfile` in its respective directory. A basic `Dockerfile` for a Python Flask app might look like this:

    ```dockerfile
    # Example Dockerfile for 'auth' service
    FROM python:3.9-slim-buster
    WORKDIR /app
    COPY requirements.txt .
    RUN pip install -r requirements.txt
    COPY . .
    CMD ["python", "app.py"]
    ```

    And `app.py` for the `auth` service:

    ```python
    # app.py for 'auth' service
    from flask import Flask
    app = Flask(__name__)

    @app.route('/auth')
    @app.route('/auth/<path:subpath>')
    def auth_service(subpath=''):
        return f"Hello from Auth Service! Path: /auth/{subpath}"

    if __name__ == '__main__':
        app.run(host='0.0.0.0', port=5000)
    ```
    Repeat for `order` and `product` services, modifying `app.py` accordingly.

2.  **Create ECR Repositories**:
    * Navigate to **ECR** in the AWS Management Console.
    * Click **Create repository**.
    * Name them `auth-service`, `order-service`, and `product-service`. Keep other settings as default.

3.  **Build and Push Docker Images**:
    * For each service, navigate to its directory in your terminal.
    * Log in to ECR (replace `<your-aws-account-id>` and `<your-region>`):
        ```bash
        aws ecr get-login-password --region <your-region> | docker login --username AWS --password-stdin <your-aws-account-id>.dkr.ecr.<your-region>.amazonaws.com
        ```
    * Build the Docker image:
        ```bash
        docker build -t auth-service .
        ```
    * Tag the image:
        ```bash
        docker tag auth-service:latest <your-aws-account-id>.dkr.ecr.<your-region>.amazonaws.com/auth-service:latest
        ```
    * Push the image to ECR:
        ```bash
        docker push <your-aws-account-id>.dkr.ecr.<your-region>.amazonaws.com/auth-service:latest
        ```
    Repeat these steps for `order-service` and `product-service`.

---

#### 2. Configure ECS Cluster and Task Definitions ⚙️

1.  **Create an ECS Cluster**:
    * Go to **ECS** in the AWS Console.
    * Click **Clusters**, then **Create Cluster**.
    * Select **Fargate** as the infrastructure type.
    * Give it a name (e.g., `MicroservicesCluster`).
    * Click **Create**.

2.  **Create IAM Task Role**:
    * Go to **IAM** in the AWS Console.
    * Click **Roles**, then **Create role**.
    * Choose **Elastic Container Service** as the service and **Elastic Container Service Task** as the use case.
    * Attach the `AmazonECSTaskExecutionRolePolicy` managed policy. This policy grants permissions for ECS tasks to pull images from ECR and publish logs to CloudWatch.
    * Give it a descriptive name (e.g., `ecsTaskExecutionRole`).

3.  **Create Task Definitions**: For each service, create a new task definition.

    * Go to **ECS** -> **Task Definitions** -> **Create new task definition**.
    * Choose **Fargate** launch type.
    * **Task Definition Name**: `auth-task-definition` (and similarly for `order` and `product`).
    * **Task Role**: Select the `ecsTaskExecutionRole` you created.
    * **Task execution role**: Select the `ecsTaskExecutionRole` you created.
    * **Task size**:
        * **CPU**: 0.25 vCPU (or higher, depending on your needs)
        * **Memory**: 0.5 GB (or higher)
    * **Container Definitions**:
        * Click **Add container**.
        * **Container name**: `auth-container`
        * **Image**: `<your-aws-account-id>.dkr.ecr.<your-region>.amazonaws.com/auth-service:latest`
        * **Port mappings**: `5000` (or whatever port your Flask app listens on).
        * **Essential container**: Checked.
        * **Log configuration**: Select `awslogs`.
            * **Log group**: `/ecs/auth-service` (this will be created automatically by ECS if it doesn't exist).
            * **Region**: Your AWS region.
            * **Stream prefix**: `ecs`
        * Click **Add**.
    * Click **Create**.
    Repeat for `order-task-definition` and `product-task-definition`, adjusting container names, images, and log group names.

---

#### 3. Create Application Load Balancer (ALB) and Target Groups ⚖️

1.  **Create Target Groups**: You'll need a separate target group for each microservice.

    * Go to **EC2** in the AWS Console -> **Load Balancers** -> **Target Groups**.
    * Click **Create target group**.
    * **Choose a target type**: `IP addresses` (for Fargate).
    * **Target group name**: `auth-tg`
    * **Protocol**: `HTTP`, **Port**: `5000` (or the port your service listens on).
    * **VPC**: Select your default VPC or the VPC where your ECS cluster is.
    * **Health checks**:
        * **Protocol**: `HTTP`
        * **Path**: `/auth` (or a specific health check endpoint your service provides, like `/health`)
    * Click **Next**, then **Create target group**.
    Repeat for `order-tg` and `product-tg`, adjusting names, ports, and health check paths.

2.  **Create an Application Load Balancer**:

    * Go to **EC2** -> **Load Balancers**.
    * Click **Create Load Balancer**.
    * Choose **Application Load Balancer**.
    * **Load balancer name**: `MicroservicesALB`
    * **Scheme**: `Internet-facing`
    * **IP address type**: `IPv4`
    * **VPC**: Select your default VPC or the VPC where your ECS cluster is.
    * **Availability Zones**: Select at least two subnets in different AZs within your chosen VPC.
    * **Security Groups**: Create a new security group or select an existing one that allows inbound HTTP (port 80) and HTTPS (port 443, if applicable) traffic from the internet, and allows outbound traffic to your ECS tasks (the port your services listen on).
    * **Listeners and routing**:
        * **Protocol**: `HTTP`, **Port**: `80`
        * **Default action**: For now, set it to forward to one of your target groups (e.g., `auth-tg`). We'll change this with rules later.
    * Click **Create load balancer**.

---

#### 4. Deploy ECS Fargate Services 📦

Now, link your task definitions to the ALB and deploy them as ECS services.

1.  **Create ECS Services**:

    * Go to **ECS** -> **Clusters** -> `MicroservicesCluster`.
    * Click **Services** tab -> **Create**.
    * **Compute options**: `Launch type`
    * **Launch type**: `Fargate`
    * **Task Definition**: Select `auth-task-definition`, Revision `1` (or latest).
    * **Service name**: `auth-service`
    * **Desired tasks**: `1` (or more for high availability).
    * **Minimum healthy percent**: `100`, **Maximum healthy percent**: `200`
    * **Deployment type**: `Rolling update`
    * **VPC, Subnets, Security Group**: Select the same VPC and subnets used for your ALB. Ensure the security group allows inbound traffic from the ALB's security group on the container's port (e.g., 5000).
    * **Load balancing**:
        * **Load balancer type**: `Application Load Balancer`
        * **Load balancer name**: Select `MicroservicesALB`
        * **Container to load balance**: Select `auth-container` and its port `5000`.
        * **Target group name**: Select `auth-tg`.
    * **Service Auto Scaling (Optional)**: Can be configured if needed.
    * Click **Next step** until you reach **Create Service**.
    Repeat for `order-service` (using `order-task-definition` and `order-tg`) and `product-service` (using `product-task-definition` and `product-tg`).

---

#### 5. Configure ALB Path-Based Routing Rules ➡️

Once your ECS services are running and registered with their respective target groups, configure the ALB to route traffic.

1.  **Modify ALB Listener Rules**:

    * Go to **EC2** -> **Load Balancers`.
    * Select `MicroservicesALB`.
    * Go to the **Listeners** tab.
    * Select the `HTTP:80` listener and click **View/edit rules**.
    * Click the **+** icon (or **Insert Rule**) to add new rules.

    **Rule 1: Auth Service**
    * **IF**: `Path is /auth/*`
    * **THEN**: `Forward to auth-tg`
    * Click **Add action**, then **Add rule**.

    **Rule 2: Order Service**
    * **IF**: `Path is /orders/*`
    * **THEN**: `Forward to order-tg`
    * Click **Add action**, then **Add rule**.

    **Rule 3: Product Service**
    * **IF**: `Path is /products/*`
    * **THEN**: `Forward to product-tg`
    * Click **Add action**, then **Add rule**.

    * **Default Rule**: Ensure the default rule (the last one) is set to a reasonable fallback, or, for testing, you could set it to one of your services or return a fixed response.

---

#### 6. Verify and Test ✅

1.  **Get ALB DNS Name**:
    * Go to **EC2** -> **Load Balancers**.
    * Select `MicroservicesALB`.
    * Copy the **DNS name**.

2.  **Test Endpoints**:
    * Open your web browser or use `curl`.
    * Access the following URLs, replacing `<ALB-DNS-name>` with your ALB's DNS name:
        * `http://<ALB-DNS-name>/auth/login` - Should return "Hello from Auth Service!"
        * `http://<ALB-DNS-name>/orders/123` - Should return "Hello from Order Service!"
        * `http://<ALB-DNS-name>/products/item/abc` - Should return "Hello from Product Service!"

3.  **Check CloudWatch Logs**:
    * Go to **CloudWatch** in the AWS Console -> **Log groups**.
    * You should see log groups like `/ecs/auth-service`, `/ecs/order-service`, and `/ecs/product-service`.
    * Click on a log group, then a log stream, to see the output from your microservices.

---

### Cleanup 🧹

To avoid incurring charges, remember to clean up all the resources you've created:

1.  **Delete ECS Services**: Go to **ECS** -> **Clusters** -> `MicroservicesCluster` -> **Services** tab. Select each service and click **Delete**.
2.  **Delete ECS Cluster**: Go to **ECS** -> **Clusters**. Select `MicroservicesCluster` and click **Delete Cluster**.
3.  **Delete Load Balancer**: Go to **EC2** -> **Load Balancers`. Select `MicroservicesALB` and click **Actions** -> **Delete load balancer**.
4.  **Delete Target Groups**: Go to **EC2** -> **Target Groups`. Select `auth-tg`, `order-tg`, `product-tg` and click **Actions** -> **Delete**.
5.  **Delete ECR Repositories**: Go to **ECR**. Select `auth-service`, `order-service`, `product-service` and click **Delete**.
6.  **Delete CloudWatch Log Groups**: Go to **CloudWatch** -> **Log groups**. Select `/ecs/auth-service`, `/ecs/order-service`, `/ecs/product-service` and click **Actions** -> **Delete log group(s)**.
7.  **Delete IAM Role**: Go to **IAM** -> **Roles**. Select `ecsTaskExecutionRole` and click **Delete role`.
8.  **Delete Security Groups**: If you created new security groups specifically for this project, delete them from **EC2** -> **Security Groups**.

This project provides a solid foundation for deploying scalable and resilient microservices on AWS using Fargate and ALB. Feel free to expand upon this by adding more services, implementing CI/CD pipelines, or integrating with other AWS services.