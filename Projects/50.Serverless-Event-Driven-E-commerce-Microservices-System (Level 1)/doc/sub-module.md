

```
root/
 ├── docker-compose.yaml        (main repo)
 ├── .npmrc
 └── services/
      ├── post-service/         (separate repo)
      ├── user-service/         (separate repo)
      ├── shared-lib/           (separate repo)
      └── swagger-service/      (separate repo)
```

You will have:

1. **1 main root repo**
2. **4 child repos (service submodules)**

Total: **5 Git repositories**.

Here is the guide from A → Z:

---

# 🟩 **PART 1 – Create a Git repo for each service**

## 1️⃣ Create Git repo for `shared-lib`

Inside folder:

```
root/services/shared-lib/
```

Run:

```sh
git init
git branch -M main
git add .
git commit -m "Initial commit shared-lib"
git remote add origin https://github.com/<you>/shared-lib.git
git push -u origin main
```

---

## 2️⃣ Create Git repo for `user-service`

Inside:

```
root/services/user-service/
```

Run:

```sh
git init
git branch -M main
git add .
git commit -m "Initial commit user-service"
git remote add origin https://github.com/<you>/user-service.git
git push -u origin main
```

---

## 3️⃣ Create Git repo for `post-service`

```sh
git init
git branch -M main
git add .
git commit -m "Initial commit post-service"
git remote add origin https://github.com/<you>/post-service.git
git push -u origin main
```

---

## 4️⃣ Create Git repo for `swagger-service`

```sh
git init
git branch -M main
git add .
git commit -m "Initial commit swagger-service"
git remote add origin https://github.com/<you>/swagger-service.git
git push -u origin main
```

---

# 🟪 **PART 2 – Create the root repo containing all submodules**

Inside:

```
root/
```

Run:

```sh
git init
git branch -M main
git add .
git commit -m "Initial commit root repo"
git remote add origin https://github.com/<you>/microservices-root.git
git push -u origin main
```

---

# 🟨 **PART 3 – Add each service to the root repo as Git Submodules**

Important!
The root repo **does not contain service code**, it only stores pointers (hashes) to each child repo.

From inside root:

```sh
cd root/
```

### 1. Add `shared-lib`

```sh
git submodule add https://github.com/<you>/shared-lib.git services/shared-lib
```

### 2. Add `user-service`

```sh
git submodule add https://github.com/<you>/user-service.git services/user-service
```

### 3. Add `post-service`

```sh
git submodule add https://github.com/<you>/post-service.git services/post-service
```

### 4. Add `swagger-service`

```sh
git submodule add https://github.com/<you>/swagger-service.git services/swagger-service
```

Finally:

```sh
git add .
git commit -m "Add all microservices as submodules"
git push
```

---

# 🟧 **PART 4 – What a new developer must do after cloning**

## 🚀 1. Clone the root repo

```sh
git clone https://github.com/<you>/microservices-root.git
cd microservices-root
```

## 🚀 2. Pull all submodules

```sh
git submodule update --init --recursive
```

💡 Always pull the latest version of each service:

```sh
git submodule update --remote --merge
```

---

# 🟥 **PART 5 – When you update code in a service**

Example: modify code in `user-service`.

### Step 1: Go into the service

```
cd services/user-service
```

### Step 2: Commit & push as a normal repo

```sh
git add .
git commit -m "Fix API login"
git push
```

### Step 3: Return to root and update the pointer

```sh
cd ../..
git add services/user-service
git commit -m "Update user-service pointer"
git push
```

---

# 🟦 **PART 6 – When another developer modifies a service**

They just run:

```
cd services/user-service
git pull
```

Then update pointer in root:

```
cd ../..
git add services/user-service
git commit -m "Update user-service submodule pointer"
git push
```

---

# 🟫 **PART 7 – Golden rules for submodules (super important)**

| Action                         | Correct | Incorrect                           |
| ------------------------------ | ------- | ----------------------------------- |
| Update each service by itself  | ✔       | ❌ Do not edit service inside root   |
| Each service pushes separately | ✔       | ❌ Do not push all from root         |
| Root contains only pointers    | ✔       | ❌ Root cannot contain service code  |
| Must run submodule update      | ✔       | ❌ Forgetting this = guaranteed fail |

---

# 🟩 **PART 8 – Summary of the recommended architecture**

### Root repo (orchestration)

* docker-compose.yaml
* .npmrc
* install.sh
* submodule pointers

### Service repo (microservice)

* code
* Dockerfile
* package.json
* README.md
* env.example

This is the **correct enterprise-grade Microservices Multi-Repo architecture**.

---

# 🎁 Want me to write additional documentation?

I can write for you:

1. **A complete README.md** for the root repo
2. **README.md templates** for each service
3. **Auto-update submodule script**
4. **GitHub Actions CI/CD** for each microservice
5. **docker-compose.dev.yaml** (hot reload + volumes)
6. **Enterprise branching strategy**

Just tell me which one you want.

---

# About your error:

```
fatal: 'services/post-service' already exists in the index
```

This means the **submodule already exists**, Git does not allow adding it again.

To switch from HTTPS → SSH, **do NOT use `git submodule add` again**.
Instead, you should **edit `.gitmodules`**, or if needed, remove & re-add the submodule.

Below are **2 official solutions** — I recommend Solution #1.

---

# ✅ **Solution 1 (RECOMMENDED): Just edit `.gitmodules` and sync**

No need to delete anything. Fast and clean.

---

## **Step 1 — Open `.gitmodules`**

Example:

```
[submodule "services/post-service"]
    path = services/post-service
    url = https://github.com/tqnhu4/post-service.git

[submodule "services/shared-lib"]
    path = services/shared-lib
    url = https://github.com/tqnhu4/shared-lib.git
```

---

## **Step 2 — Change URL to SSH**

```
[submodule "services/post-service"]
    path = services/post-service
    url = git@github.com-nhu:tqnhu4/post-service.git

[submodule "services/shared-lib"]
    path = services/shared-lib
    url = git@github.com-nhu:tqnhu4/shared-lib.git

[submodule "services/swagger-service"]
    path = services/swagger-service
    url = git@github.com-nhu:tqnhu4/swagger-service.git

[submodule "services/user-service"]
    path = services/user-service
    url = git@github.com-nhu:tqnhu4/user-service.git
```

---

## **Step 3 — Sync Git**

```
git submodule sync --recursive
```

---

## **Step 4 — Update submodules**

```
git submodule update --init --recursive
```

🎉 Done — no deletion needed, no errors.

---

# ✅ **Solution 2 — If you want to re-add submodules from scratch**

⚠️ Use only if necessary.

### Remove a submodule completely:

```
git submodule deinit -f services/post-service
rm -rf .git/modules/services/post-service
git rm -f services/post-service
```

Then add again:

```
git submodule add git@github.com-nhu:tqnhu4/post-service.git services/post-service
```

---

# 🟢 Best practice

**Use Solution #1 (edit `.gitmodules`).**
It's safe, fast, and keeps your repo clean.

---

# Next error you encountered:

```
fatal: Unable to find current revision in submodule path 'services/post-service'
```

This happens when:

* The SHA pointer no longer exists (force-push)
* Submodule folder missing
* `.gitmodules` URL incorrect
* Git cannot sync commit history

Here is the **correct fix**:

---

# ✅ **Fix without deleting the submodule**

## 1. Remove ONLY the folder (not the submodule config)

```bash
rm -rf services/post-service
```

---

## 2. Reinitialize that submodule

```bash
git submodule update --init services/post-service
```

---

# ❗If still failing → resync URLs

```bash
git submodule sync --recursive
git submodule update --init --recursive
```

---

# ❗If SHA is missing → reset submodule pointer

```
cd services/post-service
git checkout main
cd ../..
git add services/post-service
git commit -m "Fix submodule pointer"
```

Then:

```
git submodule update --init --recursive
```

---

# 🧨 **If you want a clean reset for a broken submodule**

```bash
git submodule deinit -f services/post-service
rm -rf .git/modules/services/post-service
rm -rf services/post-service
git submodule add git@github.com-nhu:tqnhu4/post-service.git services/post-service
```

---

# 🟩 Why the error happened

The root repo stores SHA commit hashes of each submodule.
If:

* the service repo was force-pushed
* the `.gitmodules` URL changed
* the folder was manually deleted

→ Git cannot find the right commit → error.


