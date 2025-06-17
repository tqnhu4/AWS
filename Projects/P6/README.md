---
## Automated CI/CD Blue/Green Deployment with ALB + CodeDeploy + ECS (Advanced)

This project guides you through setting up an automated Continuous Integration/Continuous Deployment (CI/CD) pipeline for your microservices using a **Blue/Green deployment strategy** with AWS services. This advanced setup ensures minimal downtime during application updates by shifting traffic between two distinct environments (Blue for the old version, Green for the new).

---

### 🧠 Learning Objectives 

By completing this project, you will master:

* **ALB Advanced Target Group Shifting**: Understanding how the Application Load Balancer can seamlessly redirect traffic between different sets of instances.
* **ECS with CodeDeploy**: Integrating CodeDeploy with Amazon ECS to automate complex deployment strategies like Blue/Green.
* **CI/CD with CodePipeline**: Building an end-to-end automated pipeline that compiles, tests, and deploys your application.
* **Docker, ECR, IAM Detailed Policies**: Gaining deeper insights into containerization, managing images in ECR, and configuring granular IAM permissions for your CI/CD services.

### 🛠️ Technologies & Services Used 

* **Amazon Elastic Container Service (ECS) Fargate**: Serverless compute for containers.
* **Amazon Elastic Container Registry (ECR)**: Managed Docker container image registry.
* **Application Load Balancer (ALB)**: Layer 7 load balancer for HTTP/HTTPS traffic.
* **AWS CodeDeploy**: Automates application deployments to various compute services.
* **AWS CodePipeline**: Orchestrates your release pipeline.
* **AWS CodeBuild**: Compiles source code, runs tests, and produces deployable artifacts.
* **Amazon Simple Storage Service (S3)**: Object storage for storing build artifacts and source code.
* **AWS Identity and Access Management (IAM)**: Manages access to AWS services and resources.
* **Amazon CloudWatch**: Monitoring and observability service for deployment logs and metrics.

### 📝 Project Description 

This project involves setting up a pipeline to:

* **Build the application and push the image to ECR using CodeBuild.**
* **Have CodePipeline fetch the new image and deploy it via CodeDeploy.**
* **Utilize CodeDeploy for a Blue/Green strategy, which includes:**
    * Creating new ECS tasks.
    * Shifting traffic from the old version to the new version by changing the Target Group in the ALB.
    * Testing rollback scenarios in case of deployment failures.


**High-Level Steps:**

1.  **Prepare Application & ECR**: Create a sample application and an ECR repository.
2.  **Setup ALB & Target Groups**: Configure an ALB with two target groups for Blue/Green traffic shifting.
3.  **Create ECS Cluster & Service**: Set up your ECS cluster and initial service.
4.  **Configure CodeDeploy**: Create a CodeDeploy application and deployment group for ECS Blue/Green.
5.  **Build with CodeBuild**: Create a CodeBuild project to build Docker images and push to ECR.
6.  **Orchestrate with CodePipeline**: Create a CodePipeline to automate source, build, and deploy stages.
7.  **Test Blue/Green Deployment & Rollback**: Verify the automated deployment and understand rollback mechanisms.

---

### 🚀 Step-by-Step Guide 

#### 🐳 1. Prepare Application and ECR 

For this project, you'll need a simple web application that can be easily updated to simulate new versions. Let's use a basic Flask application that displays a version number.

1.  **Create Sample Application**:
    * Create a directory named `app`.
    * Inside `app`, create `app.py`:
        ```python
        # app.py
        from flask import Flask
        import os

        app = Flask(__name__)

        @app.route('/')
        def home():
            version = os.environ.get('APP_VERSION', '1.0')
            return f"Hello from My Microservice - Version {version}!"

        if __name__ == '__main__':
            app.run(host='0.0.0.0', port=80) # Listen on port 80
        ```
    * Inside `app`, create `requirements.txt`:
        ```
        flask
        ```
    * Inside `app`, create `Dockerfile`:
        ```dockerfile
        FROM python:3.9-slim-buster
        WORKDIR /app
        COPY requirements.txt .
        RUN pip install -r requirements.txt
        COPY . .
        EXPOSE 80
        CMD ["python", "app.py"]
        ```

2.  **Create ECR Repository**:
    * Navigate to **ECR** in the AWS Management Console.
    * Click **Create repository**.
    * Name it `my-microservice`. Keep other settings as default. This repository will store your Docker images.

3.  **Initial Local Build & Push (Optional, for initial setup):**
    * You might want to manually build and push an initial image (e.g., version 1.0) to ECR to have something deployed for the "Blue" environment.
    * Log in to ECR: `aws ecr get-login-password --region <your-region> | docker login --username AWS --password-stdin <your-aws-account-id>.dkr.ecr.<your-region>.amazonaws.com`
    * Build: `docker build -t my-microservice:1.0 .` (from the `app` directory)
    * Tag: `docker tag my-microservice:1.0 <your-aws-account-id>.dkr.ecr.<your-region>.amazonaws.com/my-microservice:1.0`
    * Push: `docker push <your-aws-account-id>.dkr.ecr.<your-region>.amazonaws.com/my-microservice:1.0`

---

#### ⚖️ 2. Setup ALB and Target Groups 

For Blue/Green deployments, you need an ALB with a single listener and two associated target groups. CodeDeploy will shift traffic between these target groups.

1.  **Create Two Target Groups**:
    * Go to **EC2** in the AWS Console -> **Load Balancers** -> **Target Groups**.
    * Click **Create target group**.
    * **Choose a target type**: `IP addresses` (for Fargate).
    * **Target group name**: `my-microservice-blue-tg`
    * **Protocol**: `HTTP`, **Port**: `80` (or the port your Flask app listens on).
    * **VPC**: Select your default VPC or the VPC where your ECS cluster will reside.
    * **Health checks**:
        * **Protocol**: `HTTP`
        * **Path**: `/` (or a specific health check endpoint like `/health`)
    * Click **Next**, then **Create target group**.
    * Repeat the process to create another target group named `my-microservice-green-tg` with identical settings.

2.  **Create an Application Load Balancer**:
    * Go to **EC2** -> **Load Balancers**.
    * Click **Create Load Balancer**.
    * Choose **Application Load Balancer**.
    * **Load balancer name**: `MyMicroserviceALB`
    * **Scheme**: `Internet-facing`
    * **IP address type**: `IPv4`
    * **VPC**: Select your VPC.
    * **Availability Zones**: Select at least two subnets in different AZs within your chosen VPC.
    * **Security Groups**: Create a new security group or select an existing one that allows **inbound HTTP (port 80)** traffic from the internet, and outbound traffic to your ECS tasks (port 80).
    * **Listeners and routing**:
        * **Protocol**: `HTTP`, **Port**: `80`
        * **Default action**: Set it to forward to `my-microservice-blue-tg`. This will be your initial "Blue" environment.
    * Click **Create load balancer**.

---

#### 📦 3. Create ECS Cluster and Service 

We'll set up the foundational ECS components.

1.  **Create an ECS Cluster**:
    * Go to **ECS** in the AWS Console.
    * Click **Clusters**, then **Create Cluster`.
    * Select **Fargate** as the infrastructure type.
    * Give it a name (e.g., `MyMicroservicesCluster`).
    * Click **Create**.

2.  **Create IAM Task Role and Task Execution Role**:
    * Go to **IAM** -> **Roles** -> **Create role**.
    * For **Task Role**: Choose **Elastic Container Service** -> **Elastic Container Service Task**. Attach policies for your application needs (e.g., `AmazonEC2ContainerServiceRole` or custom policies if your app interacts with other AWS services). Name it `MyMicroserviceTaskRole`.
    * For **Task Execution Role**: Choose **Elastic Container Service** -> **Elastic Container Service Task**. Attach `AmazonECSTaskExecutionRolePolicy`. This role is crucial for ECS to pull images from ECR and send logs to CloudWatch. Name it `MyMicroserviceTaskExecutionRole`.

3.  **Create ECS Task Definition**:
    * Go to **ECS** -> **Task Definitions** -> **Create new task definition`.
    * Choose **Fargate** launch type.
    * **Task Definition Name**: `my-microservice-task-definition`
    * **Task Role**: Select `MyMicroserviceTaskRole`.
    * **Task execution role**: Select `MyMicroserviceTaskExecutionRole`.
    * **Task size**:
        * **CPU**: 0.25 vCPU
        * **Memory**: 0.5 GB
    * **Container Definitions**:
        * Click **Add container**.
        * **Container name**: `my-microservice-container`
        * **Image**: `<your-aws-account-id>.dkr.ecr.<your-region>.amazonaws.com/my-microservice:1.0` (Use your initial v1.0 image here).
        * **Port mappings**: `80`
        * **Essential container**: Checked.
        * **Log configuration**: Select `awslogs`.
            * **Log group**: `/ecs/my-microservice` (this will be created automatically).
            * **Region**: Your AWS region.
            * **Stream prefix**: `ecs`
        * Click **Add**.
    * Click **Create**.

4.  **Create ECS Service (Initial "Blue" Deployment)**:
    * Go to **ECS** -> **Clusters** -> `MyMicroservicesCluster`.
    * Click **Services** tab -> **Create`.
    * **Compute options**: `Launch type`
    * **Launch type**: `Fargate`
    * **Task Definition**: Select `my-microservice-task-definition`, Revision `1`.
    * **Service name**: `my-microservice-service`
    * **Desired tasks**: `1`
    * **Minimum healthy percent**: `100`, **Maximum healthy percent**: `200`
    * **Deployment type**: **`Blue/Green deployment (powered by AWS CodeDeploy)`** (This is crucial!).
    * **VPC, Subnets, Security Group**: Select your VPC and subnets. Ensure the security group allows inbound traffic from the ALB's security group on port 80.
    * **Load balancing**:
        * **Load balancer type**: `Application Load Balancer`
        * **Load balancer name**: Select `MyMicroserviceALB`
        * **Container to load balance**: Select `my-microservice-container` and its port `80`.
        * **Production listener**: Select `HTTP:80`.
        * **Test listener**: Create a new listener for port 8080 (`HTTP:8080`) if you want to test the green environment directly before traffic shift (optional but good practice). *For simplicity in this guide, you can skip the test listener for now, or create it if you plan to manually test the green deployment.*
        * **Target group 1 name**: `my-microservice-blue-tg` (this is your production target group)
        * **Target group 2 name**: `my-microservice-green-tg` (this is your candidate/test target group)
    * Click **Next step** until you reach **Create Service**.

---

#### 🚀 4. Configure CodeDeploy 

CodeDeploy will orchestrate the Blue/Green deployment by interacting with ECS and ALB.

1.  **Create CodeDeploy Application**:
    * Go to **CodeDeploy** in the AWS Console.
    * Click **Applications** -> **Create application**.
    * **Application name**: `MyMicroserviceApp`
    * **Compute platform**: `ECS`
    * Click **Create application`.

2.  **Create CodeDeploy Deployment Group**:
    * Select `MyMicroserviceApp`.
    * Click **Create deployment group**.
    * **Deployment group name**: `MyMicroserviceDeploymentGroup`
    * **Service role**: Create a new IAM role:
        * Go to **IAM** -> **Roles** -> **Create role**.
        * Choose **CodeDeploy** as the service and `CodeDeploy` (for ECS) as the use case.
        * Attach `AWSCodeDeployRoleForECS` managed policy.
        * Name it `CodeDeployServiceRoleForECS`.
        * Go back to CodeDeploy, refresh the service role dropdown, and select `CodeDeployServiceRoleForECS`.
    * **Environment configuration**:
        * **Amazon ECS cluster name**: `MyMicroservicesCluster`
        * **Amazon ECS service name**: `my-microservice-service`
    * **Load balancer**:
        * **Load balancer name**: `MyMicroserviceALB`
        * **Production listener port**: `80`
        * **Target group 1 name**: `my-microservice-blue-tg`
        * **Target group 2 name**: `my-microservice-green-tg`
    * **Deployment settings**:
        * **Deployment configuration**: `CodeDeployDefault.ECSAllAtOnce` (or `CodeDeployDefault.ECSLinear10PercentEvery1Minute` for a phased rollout).
        * **Blue/Green Deployment**:
            * **Terminate original task set**: Select how long to wait before terminating. You can choose `Immediately` for faster testing, or `After traffic is rerouted to the new task set` with a `time to wait` for manual verification (e.g., 5 minutes).
            * **Enable rollback**: Check this box. This is important for automatic rollback if a deployment fails or health checks fail after traffic shift.
    * Click **Create deployment group**.

---

#### 🏗️ 5. Build with CodeBuild 

CodeBuild will handle building your Docker image and pushing it to ECR.

1.  **Create `buildspec.yml`**:
    * In the root of your application repository (alongside the `app` directory), create a file named `buildspec.yml`:

        ```yaml
        version: 0.2

        phases:
          pre_build:
            commands:
              - echo Logging in to Amazon ECR...
              - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com
              - REPOSITORY_URI=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/my-microservice
              - IMAGE_TAG=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7) # Use commit hash for tag
              - echo Building Docker image with tag $IMAGE_TAG
          build:
            commands:
              - cd app # Change to your application directory
              - docker build -t $REPOSITORY_URI:$IMAGE_TAG .
              - docker tag $REPOSITORY_URI:$IMAGE_TAG $REPOSITORY_URI:latest
          post_build:
            commands:
              - echo Pushing the Docker images...
              - docker push $REPOSITORY_URI:$IMAGE_TAG
              - docker push $REPOSITORY_URI:latest
              - echo Writing image definitions file...
              - printf '[{"name":"my-microservice-container","imageUri":"%s"}]' $REPOSITORY_URI:$IMAGE_TAG > imagedefinitions.json
        artifacts:
            files:
              - imagedefinitions.json
        ```
    * **Note**: `my-microservice-container` must match the container name in your ECS Task Definition.

2.  **Create CodeBuild Project**:
    * Go to **CodeBuild** in the AWS Console.
    * Click **Build projects** -> **Create build project`.
    * **Project name**: `MyMicroserviceBuild`
    * **Source provider**: Choose your source (e.g., GitHub, CodeCommit, S3). Connect your repository.
    * **Environment**:
        * **Managed image**: `Amazon Linux 2`
        * **Runtime(s)**: `Standard`
        * **Image**: Choose the latest `aws/codebuild/amazonlinux2-x86_64:latest` image with Docker installed.
        * **Environment type**: `Linux`
        * **Service role**: Create a new service role or use an existing one. If creating, ensure it has permissions for:
            * Pushing to ECR (`ecr:PutImage`, `ecr:InitiateLayerUpload`, `ecr:UploadLayerPart`, `ecr:CompleteLayerUpload`, `ecr:BatchCheckLayerAvailability`, `ecr:BatchGetImage`)
            * Reading from S3 (if source is S3)
            * Logging to CloudWatch Logs
        * **Buildspec**: `Use a buildspec file` (make sure `buildspec.yml` is in your repository root).
    * **Artifacts**:
        * **Type**: `Amazon S3`
        * **Bucket**: Create a new S3 bucket (e.g., `my-microservice-build-artifacts`).
        * **Name**: `imagedefinitions.json`
        * **Packaging**: `None`
    * Click **Create build project`.

---

#### ➡️ 6. Orchestrate with CodePipeline 

CodePipeline glues everything together, automating the flow from source code to deployment.

1.  **Create CodePipeline**:
    * Go to **CodePipeline** in the AWS Console.
    * Click **Pipelines** -> **Create pipeline`.
    * **Pipeline name**: `MyMicroservicePipeline`
    * **Service role**: Create a new service role (e.g., `CodePipelineServiceRole`). Ensure it has permissions to interact with CodeCommit/S3, CodeBuild, CodeDeploy, and ECS.
    * **Artifact store**: `Default location` (an S3 bucket will be created for you).
    * Click **Next**.

2.  **Add Source Stage**:
    * **Source provider**: Select your source (e.g., **AWS CodeCommit**, **GitHub**, **Amazon S3**).
    * **Repository name**: Select your code repository.
    * **Branch name**: `main` or `master`.
    * **Change detection options**: `Start the pipeline on source code change` (recommended).
    * Click **Next**.

3.  **Add Build Stage**:
    * **Build provider**: `AWS CodeBuild`
    * **Project name**: `MyMicroserviceBuild`
    * **Build type**: `Single build`
    * Click **Next**.

4.  **Add Deploy Stage**:
    * **Deploy provider**: `Amazon ECS (Blue/Green)`
    * **Application name**: `MyMicroserviceApp`
    * **Deployment group**: `MyMicroserviceDeploymentGroup`
    * **Image definition file**: `imagedefinitions.json` (This is the artifact produced by CodeBuild, located at the root of your build output).
    * Click **Next**.

5.  **Review and Create**:
    * Review your pipeline configuration and click **Create pipeline`.

---

#### ✅ 7. Test Blue/Green Deployment & Rollback 

1.  **Trigger Initial Deployment**:
    * The pipeline should start automatically. Monitor its progress in CodePipeline.
    * Once successful, access your ALB's DNS name in a browser. You should see "Hello from My Microservice - Version 1.0!".

2.  **Simulate an Update (Green Deployment)**:
    * Go to your application source code.
    * Modify `app/app.py` to update the version:
        ```python
        # app.py
        from flask import Flask
        import os

        app = Flask(__name__)

        @app.route('/')
        def home():
            version = os.environ.get('APP_VERSION', '2.0') # Update to 2.0
            return f"Hello from My Microservice - Version {version}!"

        if __name__ == '__main__':
            app.run(host='0.0.0.0', port=80)
        ```
    * Commit and push this change to your source repository (e.g., `git commit -am "Update to v2.0" && git push`).

3.  **Monitor Pipeline and Deployment**:
    * CodePipeline should detect the change and automatically start.
    * **CodeBuild**: Will build the new image (`my-microservice:latest` and with a new commit hash tag) and push it to ECR.
    * **CodeDeploy**:
        * It will create a **new "Green" task set** in your ECS service, pulling the `latest` image.
        * ECS will provision new Fargate tasks, register them with the `my-microservice-green-tg`.
        * CodeDeploy will then **shift traffic** from `my-microservice-blue-tg` to `my-microservice-green-tg` on your ALB's listener.
        * Keep refreshing your ALB's DNS name in the browser. You should see the version switch from "1.0" to "2.0" almost instantly.
        * After the configured wait time (if any) and successful traffic shift, CodeDeploy will **terminate the old "Blue" task set**.

4.  **Test Rollback**:
    * To test a rollback, you can either:
        * **Manually initiate a rollback**: In CodeDeploy, go to your deployment group, select the recent deployment, and click **Rollback**.
        * **Simulate a failed deployment**: Create a new version (e.g., 3.0) with a health check that intentionally fails (e.g., an endpoint returning 500). Push this code. When CodeDeploy attempts to shift traffic, if the health checks on the new "Green" environment fail, CodeDeploy will automatically roll back to the previous stable "Blue" version, and traffic will remain on the old task set.

---

### 🧹 Cleanup 

To avoid incurring charges, remember to clean up all the resources you've created:

1.  **Delete CodePipeline**: Go to **CodePipeline** -> **Pipelines**. Select `MyMicroservicePipeline` and click **Delete**. This will also delete associated S3 artifact buckets.
2.  **Delete CodeBuild Project**: Go to **CodeBuild** -> **Build projects**. Select `MyMicroserviceBuild` and click **Delete build project**.
3.  **Delete CodeDeploy Application**: Go to **CodeDeploy** -> **Applications**. Select `MyMicroserviceApp` and click **Delete application**. This will also delete its deployment groups.
4.  **Delete ECS Service**: Go to **ECS** -> **Clusters** -> `MyMicroservicesCluster` -> **Services** tab. Select `my-microservice-service` and click **Delete**.
5.  **Delete ECS Task Definition**: Go to **ECS** -> **Task Definitions`. Select `my-microservice-task-definition` and click **Deregister** for all revisions, then **Delete task definition**.
6.  **Delete ECS Cluster**: Go to **ECS** -> **Clusters**. Select `MyMicroservicesCluster` and click **Delete Cluster**.
7.  **Delete Load Balancer**: Go to **EC2** -> **Load Balancers`. Select `MyMicroserviceALB` and click **Actions** -> **Delete load balancer**.
8.  **Delete Target Groups**: Go to **EC2** -> **Target Groups`. Select `my-microservice-blue-tg` and `my-microservice-green-tg` and click **Actions** -> **Delete**.
9.  **Delete ECR Repository**: Go to **ECR**. Select `my-microservice` and click **Delete**.
10. **Delete CloudWatch Log Groups**: Go to **CloudWatch** -> **Log groups**. Delete `/ecs/my-microservice` and any CodeBuild/CodePipeline/CodeDeploy related log groups.
11. **Delete IAM Roles**: Go to **IAM** -> **Roles**. Delete `MyMicroserviceTaskRole`, `MyMicroserviceTaskExecutionRole`, `CodeDeployServiceRoleForECS`, and `CodePipelineServiceRole` (and any other roles created by CodeBuild/CodePipeline if you used "new service role").
12. **Delete Security Groups**: If you created new security groups for this project, delete them from **EC2** -> **Security Groups**.

This comprehensive setup demonstrates a robust and automated CI/CD pipeline with Blue/Green deployment, significantly improving your application's reliability and release process. What aspects of this setup are you most excited to explore further?