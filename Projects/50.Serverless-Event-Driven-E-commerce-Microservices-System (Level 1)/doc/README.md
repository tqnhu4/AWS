# Build image
docker build -t post-service .

# Run container
docker run -d -p 3003:3003 \
  -e DB_USER=postgres \
  -e DB_PASSWORD=password \
  -e DB_HOST=host.docker.internal \
  -e DB_NAME=postdb \
  -e JWT_SECRET=your_jwt_secret_key \
  --name post-service post-service
---------------------------------------------



* **user-service**
* **post-service**
* **PostgreSQL database**

Tất cả các container này sẽ nằm trong **cùng một Docker network nội bộ**, để chúng có thể giao tiếp qua **service name** thay vì `localhost`.

---

## 🧱 File: `docker-compose.yml`



---

## 🧠 Giải thích cấu trúc:

| Thành phần            | Mục đích                                                                               |
| --------------------- | -------------------------------------------------------------------------------------- |
| **user-service**      | Microservice quản lý người dùng (chạy cổng `3002`)                                     |
| **post-service**      | Microservice quản lý bài viết (chạy cổng `3003`)                                       |
| **postgres**          | Database dùng chung, được mount vào volume `pgdata`                                    |
| **microservices-net** | Mạng bridge nội bộ để các service gọi nhau qua DNS (ví dụ: `postgres`, `user-service`) |

---

## 📂 Cấu trúc thư mục nên có

```
project-root/
├── docker-compose.yml
├── user-service/
│   ├── Dockerfile
│   ├── src/
│   │   └── app.js
│   ├── package.json
│   └── ...
├── post-service/
│   ├── Dockerfile
│   ├── src/
│   │   └── app.js
│   ├── package.json
│   └── ...
└── init-scripts/
    └── init.sql
```

---

## 🗃️ File `init-scripts/init.sql` (tạo DB riêng cho từng service)

Tạo file này để PostgreSQL tự tạo database khi container khởi động:

```sql
CREATE DATABASE userdb;
CREATE DATABASE postdb;
```

---

## 🚀 Cách chạy hệ thống

```bash
# Build toàn bộ service
docker compose build

# Khởi động hệ thống
docker compose up -d

# Kiểm tra các container đang chạy
docker ps
```

---

## 🔗 Giao tiếp giữa các service

Bên trong Docker network:

* `user-service` có thể truy cập DB qua:
  👉 `postgres:5432`
* `post-service` có thể truy cập `user-service` qua:
  👉 `http://user-service:3002`
* `post-service` cũng truy cập DB qua:
  👉 `postgres:5432`

---

## ✅ Health check nhanh

```bash
curl http://localhost:3002/health   # kiểm tra user-service
curl http://localhost:3003/health   # kiểm tra post-service
```

---

Bạn có muốn mình viết thêm phần **Dockerfile mẫu cho user-service** (tương tự post-service) để bạn copy vào `./user-service/Dockerfile` luôn không?
Nó sẽ đảm bảo toàn bộ hệ thống build và chạy mượt ngay.

============================


terraform init
terraform plan
terraform apply -auto-approve

====
Cách tạo EC2
Chọn loại mặc định rồi cài Docker và Agent

#!/bin/bash

sudo dnf update -y
sudo dnf install -y docker
sudo systemctl enable docker
sudo systemctl start docker

sudo mkdir -p /etc/ecs
echo "ECS_CLUSTER=microservices-cluster" | sudo tee /etc/ecs/ecs.config

---

sudo docker run --name ecs-agent --detach --restart=always \
  --volume=/var/run/docker.sock:/var/run/docker.sock \
  --volume=/var/log/ecs/:/log \
  --volume=/var/lib/ecs/data:/data \
  --net=host \
  --env-file=/etc/ecs/ecs.config \
  amazon/amazon-ecs-agent:latest

Cài và khởi động ECS Agent
sudo dnf install -y ecs-init
sudo systemctl enable --now ecs
sudo systemctl status ecs  


Instance Role:

AmazonEC2ContainerRegistryReadOnly
AmazonEC2ContainerServiceforEC2Role
AmazonEC2ContainerServiceRole
CloudWatchAgentServerPolicy


---
Kiem tra loi tren service
aws ecs describe-services --cluster microservices-cluster --services user-service

---
- name: 🧾 Get AWS Account ID
        run: |
          ACCOUNT_ID=$(aws sts get-caller-identity --query "Account" --output text)
          echo "ACCOUNT_ID=$ACCOUNT_ID" >> $GITHUB_ENV

      - name: 🔍 Get Cloud Map Service ID
        run: |
          SERVICE_ID=$(aws servicediscovery list-services --query "Services[?Name=='post-service'].Id" --output text)
          echo "SERVICE_ID=$SERVICE_ID" >> $GITHUB_ENV

      - name: 🧩 Compose Cloud Map ARN
        run: |
          CLOUDMAP_ARN="arn:aws:servicediscovery:${{ secrets.AWS_REGION }}:${ACCOUNT_ID}:service/${SERVICE_ID}"
          echo "CLOUDMAP_ARN=$CLOUDMAP_ARN" >> $GITHUB_ENV

      - name: 🧾 Replace Cloud Map ARN in task definition
        run: |
          sed -i "s|arn:aws:servicediscovery:REPLACE_ME|$CLOUDMAP_ARN|g" ecs-task-def.json

