

# ✅ **PART 1 — Full A–Z Process to Create a GitHub Package (NPM)**

(Applies to **multi-repo**, one service per repo — correct for your microservices model)

---

# 🟦 **A. Prepare the Shared Library (shared-lib)**

## 1️⃣ Create the `shared-lib` repo

This repo contains shared code (validator, DTO, helper…).

Structure:

```
shared-lib/
 ├── package.json
 ├── index.js
 └── .npmrc
```

---

## 2️⃣ Create the `package.json` file

> **Important note:** the package name must follow:
> **@github-user-or-org/package-name**

Example:

```json
{
  "name": "@nhut/shared-lib",
  "version": "1.0.0",
  "main": "index.js",
  "license": "MIT"
}
```

---

## 3️⃣ Create the `.npmrc` file inside shared-lib

```txt
@nhut:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

---

## 4️⃣ Commit & push shared-lib to GitHub

OK.

---

## 5️⃣ Get the GitHub Token used for publishing

Go to:
**GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)**

Click **Generate new token (classic)**
Select permissions:

* ✔ `write:packages`
* ✔ `read:packages`
* ✔ `repo`
  (required if the repo is private)

Copy the token → temporarily export it in your terminal:

```bash
export GITHUB_TOKEN="ghp_xxxxxxxx"

```

---

## 6️⃣ Publish the package to GitHub Packages

From the root of shared-lib:

```bash
npm publish
```

After successful publishing:

✔ A **Packages** tab will appear in the repo
✔ You can view and manage versions inside it

---


# 🟧 **PART 2 — Use the Package inside post-service / user-service**

---

## 7️⃣ In the post-service repo, add a `.npmrc` file

📌 **.npmrc inside post-service**

```txt
@nhut:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Note:
For security, you should NOT commit the token to Git.

---

## 8️⃣ Add the package to the `package.json` of post-service

```json
{
  "dependencies": {
    "@nhut/shared-lib": "1.0.0"
  }
}
```

---

## 9️⃣ Set the token inside Docker (DEV + PROD)

### 🔵 Best practice: use ENV

**Dockerfile**

```Dockerfile
ARG GITHUB_TOKEN
ENV GITHUB_TOKEN=$GITHUB_TOKEN
```

**docker build**

```bash
docker build --build-arg GITHUB_TOKEN=$GITHUB_TOKEN -t post-service .
```

---

## 🔟 Install dependencies

```bash
npm install
```

---

---

# 🟩 **PART 3 — Standard CI/CD for Microservices**

Example GitHub Actions for post-service:

`.github/workflows/deploy.yml`

```yaml
name: Deploy Post Service

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Set up Node
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Configure npm for GitHub Packages
        run: |
          echo "@nhut:registry=https://npm.pkg.github.com" >> ~/.npmrc
          echo "//npm.pkg.github.com/:_authToken=${{ secrets.GITHUB_TOKEN }}" >> ~/.npmrc

      - name: Install dependencies
        run: npm install

      - name: Build Docker image
        run: |
          docker build \
            --build-arg GITHUB_TOKEN=${{ secrets.GITHUB_TOKEN }} \
            -t post-service .

      - name: Push to ECR
        run: echo "push image to AWS ECR"
```

### shared-lib/package.json

```json
{
  "name": "@repo/shared-lib",
  "version": "1.0.0"
}
```

### post-service/package.json

```json
{
  "dependencies": {
    "@repo/shared-lib": "1.0.0"
  }
}
```

### Run:

```bash
pnpm install
```

**→ shared-lib is automatically linked into post-service**
No need to publish
No need for token
No need for GitHub Packages

---


----

# update code
git commit -am "feat: update event bus"

npm version patch
git push origin main --tags

npm publish

