## 🧩 **OVERVIEW OF THE OBJECTIVE**


1. Create an EC2 → install Docker + ECS Agent
2. Create an AMI from that EC2
3. Use this AMI in a **Launch Template**
4. Create an **Auto Scaling Group** (ASG) → enable Spot Instances → attach to ECS Cluster

---

## 🪜 **STEP 1: Create EC2 and install Docker + ECS Agent**

### 1.1. Create EC2:

* Go to **EC2 Console → Launch Instance**
* Choose Amazon Linux 2 (x86_64 or arm64 depending on ECS cluster)
* Instance type: `t3.medium`
* Key pair: select or create a new one
* Network: default or the VPC of your ECS Cluster
* Storage: keep default (8–20 GB)
* Security group: open port 22 (SSH) + 80 (if needed)

### 1.2. SSH into the EC2 instance

```bash
ssh -i your-key.pem ec2-user@<EC2_PUBLIC_IP>
```

### 1.3. Install Docker

```bash
sudo yum update -y
sudo amazon-linux-extras install docker -y
sudo service docker start
sudo usermod -a -G docker ec2-user
```

### 1.4. Install ECS Agent

```bash
sudo mkdir -p /etc/ecs
echo "ECS_CLUSTER=your-ecs-cluster-name" | sudo tee /etc/ecs/ecs.config
sudo docker run --name ecs-agent --detach --restart=always \
  --volume=/var/run/docker.sock:/var/run/docker.sock \
  --volume=/var/log/ecs/:/log \
  --volume=/var/lib/ecs/data:/data \
  --net=host \
  --env-file=/etc/ecs/ecs.config \
  amazon/amazon-ecs-agent:latest
```

✅ Check:

```bash
docker ps
```

If you see the `amazon-ecs-agent` container running, it’s OK.

---

## 🧱 **STEP 2: Create an AMI from this EC2**

1. Go to **EC2 Console → Instances**, select the EC2 you created.
2. **Actions → Image and templates → Create Image**
3. Fill in:

   * Name: `ecs-docker-custom-ami`
   * Description: `Custom ECS Image with Docker & Agent`
4. Click **Create Image**

Wait a few minutes, then you'll see the AMI appear under **AMIs**.

---

## ⚙️ **STEP 3: Create Launch Template**

1. Go to **EC2 Console → Launch Templates → Create launch template**
2. Enter:

   * **Name**: `ecs-spot-template`
   * **AMI**: choose the AMI you created
   * **Instance type**: `t3.medium`
   * **Key pair**: select a key for SSH
   * **Security group**: select your existing group
   * **IAM role**: ECS Instance Role (permissions for ECS + CloudWatch)
   * **Advanced details**:

     * User data (optional, if needed):

       ```bash
       #!/bin/bash
       echo "ECS_CLUSTER=your-ecs-cluster-name" > /etc/ecs/ecs.config
       ```
     * **Spot instances**: enable ✅ “Request Spot Instances”

       * Allocation strategy: “capacity-optimized”
       * Spot instance request type: “persistent”
3. Create the template ✅

---

## 🚀 **STEP 4: Create Auto Scaling Group (ASG)**

1. **EC2 → Auto Scaling Groups → Create Auto Scaling group**
2. Name: `ecs-asg-spot`
3. Launch template: select the above template (`ecs-spot-template`)
4. Network:

   * Choose the VPC and Subnets your ECS Cluster uses
5. Load balancing:

   * **Select ECS Cluster** (you will see the attach option)
6. Desired capacity:

   * Min = 1
   * Max = 5 (or more)
   * Desired = 1
7. Scaling policy:

   * You can choose “Target tracking” (CPU > 70% → scale out)
8. Review → Create ASG ✅

---

## 🧩 **STEP 5: Verify ECS Cluster Connection**

After the ASG launches an EC2:

* Go to **ECS → Clusters → your-cluster → ECS Instances**
* If the new EC2 appears in the “ECS Instances” tab → success 🎉

---

## 💰 **Spot Cost Optimization**

* Enable “Instance type diversification” (multiple instance types like `t3`, `t3a`, `t4g`)
* Use “capacity-optimized” allocation strategy
* Set Max price = on-demand price (AWS auto-calculates, no need to set lower)

---
