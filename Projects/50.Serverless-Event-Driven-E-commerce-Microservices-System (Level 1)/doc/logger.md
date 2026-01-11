
## Winston + Loki + Grafana

➡ Add Loki datasource → view logs in realtime
[http://localhost:3000](http://localhost:3000)

```
-----------

┌────────────┐
│  Node Code │
│ (Winston)  │
└─────┬──────┘
      │ stdout (JSON log)
      ▼
┌────────────┐
│   Docker   │
│  Container │
└─────┬──────┘
      │ docker logs
      ▼
┌────────────┐
│  Promtail  │
│ (Collector)│
└─────┬──────┘
      │ HTTP Push
      ▼
┌────────────┐
│    Loki    │
│ (Storage)  │
└─────┬──────┘
      │ Query (LogQL)
      ▼
┌────────────┐
│  Grafana   │
│   (UI)     │
└────────────┘
```

Your Docker Compose setup is **already very good for microservices** 👍
👉 **But to make Winston → Loki → Grafana work CORRECTLY & ACTUALLY VIEW LOGS**, you **must add one missing component**:

> ❗ **PROMTAIL** (currently missing)

Loki **does not read Docker logs by itself** — Promtail is the log collection agent.

---

# 1️⃣ What You ALREADY DID RIGHT

✔ Winston logs to `stdout`
✔ Everything runs with Docker Compose
✔ Loki + Grafana are present
✔ Microservices are clearly separated

👉 **Only missing Promtail + configuration**

---

# 2️⃣ WHAT NEEDS TO BE ADDED? (SUMMARY)

| Component       | Status         |
| --------------- | -------------- |
| Winston         | ✅ OK           |
| Docker stdout   | ✅ OK           |
| Loki            | ✅ Yes          |
| Grafana         | ✅ Yes          |
| **Promtail**    | ❌ MISSING      |
| Loki datasource | ❌ Needs config |

---

# 3️⃣ ADD PROMTAIL (REQUIRED)

## 📁 Add file: `promtail-config.yml`

```yaml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: docker
    docker_sd_configs:
      - host: unix:///var/run/docker.sock
        refresh_interval: 5s

    relabel_configs:
      - source_labels: ['__meta_docker_container_name']
        target_label: container

      - source_labels: ['__meta_docker_container_image']
        target_label: image

      - source_labels: ['__meta_docker_container_name']
        regex: '/(.*)'
        target_label: service
```

📌 Promtail will:

* Read **stdout of all containers**
* Attach label `service=<container_name>`

---

## 🧩 Add `promtail` service to docker-compose

```yaml
  promtail:
    image: grafana/promtail:2.9.0
    container_name: promtail
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./promtail-config.yml:/etc/promtail/config.yml
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
    command: -config.file=/etc/promtail/config.yml
    depends_on:
      - loki
    networks:
      - microservices-net
```

---

# 4️⃣ CONNECT GRAFANA → LOKI

### Access Grafana

```
http://localhost:3000
```

* User: `admin`
* Password: `admin`

### Add datasource

* Type: **Loki**
* URL:

```
http://loki:3100
```

Save & Test → ✅

---

# 5️⃣ QUERY LOGS IN GRAFANA (VERY IMPORTANT)

### View user-service logs

```logql
{service="user-service"}
```

### View post-service logs

```logql
{service="post-service"}
```

### Filter errors

```logql
{service="user-service"} |= "error"
```

---

# 6️⃣ DO YOU NEED TO CHANGE WINSTON CODE?

❌ **NO**

Your current code:

```js
new transports.Console()
```

👉 **This is the BEST PRACTICE configuration for Loki**

---

# 7️⃣ ADVANCED RECOMMENDATIONS (HIGHLY RECOMMENDED)

### A. Add `env` label (recommended)

In Winston:

```js
defaultMeta: {
  service: serviceName,
  env: process.env.NODE_ENV || 'dev'
}
```

Query:

```logql
{service="user-service", env="production"}
```

---

### B. Attach `requestId` (lightweight distributed tracing)

* Extremely useful when debugging APIs via nginx
* Works well with Consul + API Gateway

---

# 8️⃣ Anti-patterns – DO NOT DO THIS

❌ Write log files inside containers
❌ Install `winston-loki`
❌ Parse logs in Node.js
❌ Push logs directly via HTTP

---

# 9️⃣ CONCLUSION

👉 With your current docker-compose:

| Task                     | Status             |
| ------------------------ | ------------------ |
| Logging system           | ⚠️ Incomplete      |
| After adding Promtail    | ✅ Production-ready |
| Need to change Node code | ❌ No               |
| View logs via web UI     | ✅ Grafana          |
