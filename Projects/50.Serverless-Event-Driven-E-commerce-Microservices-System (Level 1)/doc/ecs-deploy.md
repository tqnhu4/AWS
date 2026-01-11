

## 🧭 Goals

Set up automated CI/CD for `user-service`:

* 🐳 Build Docker image
* 📦 Push to **Amazon ECR**
* 🚀 Deploy to **ECS (Fargate)** every time you `git push main`

---

## ⚙️ 1. Project structure

```
user-service/
│
├── src/
│   └── app.js
├── package.json
├── Dockerfile
└── .github/
    └── workflows/
        └── ecs-deploy.yml
```

---

## 🐳 2. Dockerfile (Node.js + Express)

```dockerfile
FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 4001

CMD ["npm", "start"]
```

---

## 🧱 3. Create Amazon ECR (Elastic Container Registry)

Run in terminal (AWS CLI):

```bash
aws ecr create-repository --repository-name user-service --region ap-southeast-1
```

**Output:**
Example ECR URI:

```
123456789012.dkr.ecr.ap-southeast-1.amazonaws.com/user-service
```

---

## ⚙️ 4. Configure ECS Cluster (one-time setup)

You can create an ECS cluster via **AWS Console** or CLI:

```bash
aws ecs create-cluster --cluster-name microservices-cluster
```

> ⚠️ If you have multiple services (user, post…), put them all inside **one cluster**.

---

## 🧩 5. Create Task Definition for `user-service`

File: `ecs-task-def.json`
(place it at repo root or inside `.github/`)

```json
{
  "family": "user-service-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "user-service",
      "image": "<ECR_URI>:latest",
      "portMappings": [
        {
          "containerPort": 4001,
          "protocol": "tcp"
        }
      ],
      "essential": true
    }
  ],
  "executionRoleArn": "arn:aws:iam::<ACCOUNT_ID>:role/ecsTaskExecutionRole"
}
```

> 💡 Replace `<ECR_URI>` with your real ECR repo
> (e.g. `123456789012.dkr.ecr.ap-southeast-1.amazonaws.com/user-service`)

---

## 🔑 6. Grant IAM permissions for GitHub Actions

Create an IAM user for the CI/CD bot with permissions:

### Required permissions:

* `AmazonECS_FullAccess`
* `AmazonEC2ContainerRegistryFullAccess`
* `AmazonS3ReadOnlyAccess`

### Retrieve the two keys:

* `AWS_ACCESS_KEY_ID`
* `AWS_SECRET_ACCESS_KEY`

---

## 🔒 7. Add GitHub Secrets

Go to **Settings → Secrets → Actions** and add:

| Secret Name             | Description             |
| ----------------------- | ----------------------- |
| `AWS_ACCESS_KEY_ID`     | IAM access key          |
| `AWS_SECRET_ACCESS_KEY` | IAM secret key          |
| `AWS_REGION`            | e.g., `ap-southeast-1`  |
| `ECR_REPOSITORY`        | `user-service`          |
| `ECS_CLUSTER`           | `microservices-cluster` |
| `ECS_SERVICE`           | `user-service`          |
| `ECS_TASK_FAMILY`       | `user-service-task`     |

---

## ⚙️ 8. GitHub Actions Workflow: `.github/workflows/ecs-deploy.yml`

```yaml
name: CI/CD to Amazon ECS (User Service)

on:
  push:
    branches: [ "main" ]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: 🧩 Checkout code
        uses: actions/checkout@v4

      - name: 🐳 Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: ⚙️ Build, tag, and push image to ECR
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: ${{ secrets.ECR_REPOSITORY }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:latest .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest

      - name: 🧾 Render Amazon ECS task definition
        id: render-task
        uses: aws-actions/amazon-ecs-render-task-definition@v1
        with:
          task-definition: ecs-task-def.json
          container-name: user-service
          image: ${{ steps.login-ecr.outputs.registry }}/${{ secrets.ECR_REPOSITORY }}:latest

      - name: 🚀 Deploy to Amazon ECS
        uses: aws-actions/amazon-ecs-deploy-task-definition@v1
        with:
          task-definition: ${{ steps.render-task.outputs.task-definition }}
          service: ${{ secrets.ECS_SERVICE }}
          cluster: ${{ secrets.ECS_CLUSTER }}
          wait-for-service-stability: true
```

---

## 🔁 9. Workflow behavior

| Step                                               | Description                       |
| -------------------------------------------------- | --------------------------------- |
| 🧩 Push code to GitHub                             | CI/CD pipeline runs automatically |
| 🐳 Build Docker image                              |                                   |
| 📦 Push image to ECR                               |                                   |
| 🚀 ECS receives new task                           |                                   |
| 🔄 `user-service` container restarts with new code |                                   |

---

## 🧠 10. Verify results

Go to AWS Console → **ECS → Cluster → user-service → Tasks**
You will see a **new Task running** with the **latest image** from ECR.
