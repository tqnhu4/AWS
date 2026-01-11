
---

### 🎯 **Project: Microservices Blog Platform (Basic Level)**

#### ✅ **Project Goal**

Design a simple Blog platform (users → posts) using a Microservices architecture and deploy the entire system on AWS.

---

### 📐 **Architectural Mindset (Solution Architect Perspective)**

> **“Even though the system is small, the architecture should aim for scalability, independence, resilience, and easy CI/CD automation.”**

* **Service separation**:

  * `post-service`
  * `user-service`

* **Communication between services**:

  * **Synchronous**: Internal REST via **Amazon API Gateway**
  * **Asynchronous**: **Amazon EventBridge** or **SNS** for order creation and status notifications

---

### ☁️ **AWS Services Used**

| Component            | AWS Service                        | Purpose                                   |
| -------------------- | ---------------------------------- | ----------------------------------------- |
| 🖥️ Compute          | ECS Fargate                        | Run containers without managing EC2       |
| 🌐 API Gateway       | Amazon API Gateway (HTTP)          | Expose external APIs                      |
| 🔎 Service Discovery | AWS Cloud Map                      | Internal service registry                 |
| 🔔 Messaging/Event   | Amazon SNS or EventBridge          | Send events between microservices         |
| 🗄️ Database         | Amazon RDS (PostgreSQL) / DynamoDB | Persistent data storage                   |
| 📈 Monitoring        | Amazon CloudWatch + AWS X-Ray      | Logging, metrics & distributed tracing    |
| 🔄 CI/CD             | AWS CodePipeline + CodeBuild       | Automated build & deploy for each service |
| 🔐 Secrets           | AWS Secrets Manager                | Securely store DB credentials             |

---

### 🔐 **Security & IAM (Best Practices)**

* IAM Role per microservice (principle of **least privilege**)
* IAM AssumeRole for developers to access production from other environments (cross-account access)
* API Gateway with `JWT Authorization` or `Lambda Authorizer`

---

### 📊 **Logging & Monitoring**

* Each service pushes logs to **CloudWatch Logs**
* Trace inter-service call chains using **AWS X-Ray**

---

### 🧩 **Scalability**

* Each service scales independently on ECS
* Database can follow **database-per-service** (vertical scaling)
* DynamoDB can be used for a schema-less NoSQL approach

---

### 🛠️ **DevOps & CI/CD**

* Each service has its own deployment pipeline
* Typical pipeline: **Github Action → ECR → ECS Deploy**
* Use `Infrastructure as Code` with **AWS CloudFormation / Terraform**

---
