

> **API Gateway → VPC Link → NLB → ECS (Fargate) + Cloud Map**

---

## 🎯 Final Goal

You will end up with:

* An **ECS Service** running the `user-service` container
* **Cloud Map** providing automatic service discovery for ECS
* An **internal NLB** load-balancing traffic to ECS tasks
* **API Gateway** exposing a public endpoint that routes requests to ECS through **VPC Link**

---

## 🧭 High-Level Architecture

```
Client
  ↓
API Gateway (HTTP API)
  ↓
VPC Link
  ↓
NLB (internal)
  ↓
ECS Service (Fargate)
  ↓
Cloud Map (Service Discovery)
```

---

# 🧩 PART 1 – Create Cloud Map Namespace

### Step 1: Open Cloud Map Console

1. Go to AWS Console → search **“Cloud Map”**
2. Click **Create namespace**

### Step 2: Configure namespace

* **Namespace type:** *Private DNS namespace*
* **Namespace name:** `micro.local`
* **VPC:** select the VPC your ECS cluster will use
* Click **Create namespace**

🟢 Result: you now have a `micro.local` namespace for ECS service discovery.

---

# 🐳 PART 2 – Create ECS Cluster & ECS Service

### Step 1: ECS Cluster

1. AWS Console → **ECS → Clusters → Create Cluster**
2. Choose **Networking only (Fargate)**
3. Cluster name: `microservices-cluster`
4. Click **Create**

---

### Step 2: Task Definition

1. ECS → **Task Definitions → Create new**
2. Launch type: **Fargate**
3. Task name: `user-service-task`
4. Container settings:

   * Name: `user-service`
   * Image (example): `nginxdemos/hello:latest`
   * Port mappings: `8080`
5. Click **Create**

---

### Step 3: Create ECS Service

1. ECS → Cluster → `microservices-cluster` → **Create service**
2. Launch type: **Fargate**
3. Task definition: `user-service-task`
4. Service name: `user-service`
5. Desired tasks: `2`
6. Networking:

   * VPC: same VPC used in Cloud Map
   * Subnets: choose **private subnets**
   * Security group: allow **port 8080 internal access**
7. Load balancer:

   * Select **Network Load Balancer (NLB)**
   * Click **Create new NLB**
   * Name: `nlb-user-service`
   * Scheme: **Internal**
   * Listener: `TCP 80 → target group port 8080`
8. Service discovery:

   * Check **Enable service discovery integration**
   * Namespace: `micro.local`
   * Service name: `user-service`
9. Click **Create Service**

🟢 ECS will automatically:

* Create an internal NLB
* Create a target group
* Register each task into Cloud Map (`user-service.micro.local`)

---

# 🌐 PART 3 – Create API Gateway + VPC Link

### Step 1: Create VPC Link

1. API Gateway → **VPC Links → Create VPC Link**
2. Name: `ecs-vpc-link`
3. Type: **Network Load Balancer**
4. Select the NLB you created: `nlb-user-service`
5. Click **Create**
6. Wait until status = `Available`

---

### Step 2: Create API Gateway (HTTP API)

1. API Gateway → **Create API → HTTP API**
2. Name: `microservice-api`
3. Integration type: **VPC Link**
4. Integration settings:

   * VPC Link: `ecs-vpc-link`
   * Method: `ANY`
   * Endpoint URL (two options):

     **Option A: Use Cloud Map DNS**

     ```
     http://user-service.micro.local
     ```

     **Option B: Use NLB directly**

     ```
     http://<NLB-DNS>:80
     ```
5. Route: `/users/{proxy+}`
6. Integration: VPC Link
7. Deploy to stage: `prod`

---

# 🧪 PART 4 – Test the Setup

### Step 1: Get the API Gateway URL

Example:

```
https://abcd1234.execute-api.ap-southeast-1.amazonaws.com/prod/users
```

### Step 2: Test

```bash
curl https://abcd1234.execute-api.ap-southeast-1.amazonaws.com/prod/users
```

🟢 Expected behavior:

* API Gateway receives request
* Passes through **VPC Link** → **NLB**
* Forwarded to ECS task
* Response returned to client

---

# 🧠 PART 5 – Let ECS Services Call Each Other (Cloud Map)

If you add another service (e.g., `order-service`):

It will register as:

```
order-service.micro.local
```

Then your `user-service` can call it internally:

```bash
curl http://order-service.micro.local:8080/orders
```

Cloud Map automatically resolves DNS inside the VPC.

---

# ✅ Summary

| Component           | Responsibility                                            |
| ------------------- | --------------------------------------------------------- |
| **API Gateway**     | Public entry point                                        |
| **VPC Link**        | Secure connection to VPC                                  |
| **NLB (internal)**  | Load balancing across ECS tasks                           |
| **ECS + Cloud Map** | Run microservice + internal service discovery             |
| **Overall Flow**    | `Client → API Gateway → VPC Link → NLB → ECS → Cloud Map` |
