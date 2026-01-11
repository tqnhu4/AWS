

# ✅ 1. `repository: tqnhu4/root` → what should it be changed to?

You said your root repo is:

```
https://github.com/tqnhu4/microservice
```

So in your GitHub Actions workflow, change:

```
repository: tqnhu4/root
```

➡ **To your actual root repo:**

```
repository: tqnhu4/microservice
```

---

# ✅ 2. What is `ROOT_TOKEN`? Is it the same as `GITHUB_TOKEN`?

**No, it is not.**

### ❌ You CANNOT use `GITHUB_TOKEN`

`GITHUB_TOKEN` only has permission to push changes **within the same repo** where the workflow is running.

You are running the workflow inside a **submodule repo**, but you want to push updates to the **root repo**, therefore:

### 👉 You MUST create a Personal Access Token (PAT)

Recommended secret name:

```
ROOT_TOKEN
```

### Required permissions:

* `repo` (full access)
* `workflow` (optional but recommended)

### How to create the PAT:

1. Go to GitHub → **Settings**
2. Developer settings
3. Personal access tokens → Fine-grained tokens
4. Create a token with **repo** permissions for `microservice`
5. Copy the token
6. Go to the service repo (e.g., post-service) → Settings → Secrets and variables
7. Add:

   *Name:* `ROOT_TOKEN`
   *Value:* paste the PAT

🔥 This token allows the service repo workflow to push commits into the root repo.

---

# ✅ 3. What is `$GITHUB_SHA`? Where does it come from?

### `$GITHUB_SHA` is a built-in GitHub Actions variable

👉 It automatically contains the **commit hash of the commit that triggered the workflow**.

Example:

You commit to the `post-service` repo:

```
feat: add new API
```

GitHub Actions sets:

```
GITHUB_SHA = 4b713b1f3e9c7fc...
```

Then you use this SHA when updating the submodule pointer:

```bash
cd services/post-service
git checkout $GITHUB_SHA
```

No need to define it — GitHub creates it automatically.

---

# 🔥 QUICK SUMMARY

| Item          | Correct Value                                       |
| ------------- | --------------------------------------------------- |
| `repository:` | `tqnhu4/microservice`                               |
| `ROOT_TOKEN`  | Your Personal Access Token — **NOT** `GITHUB_TOKEN` |
| `$GITHUB_SHA` | Auto-generated commit hash from GitHub Actions      |

---

# 👉 If you want, I can write the **full GitHub Actions workflow** for ALL of your services:

* post-service
* user-service
* shared-lib
* swagger-service

Just copy-paste and it will work immediately.

========================================================

Okay, here is the **complete GitHub Actions workflow** to automatically update the root repo whenever any service pushes code.

Your structure:

```
root/
 ├── docker-compose.yaml
 ├── .npmrc
 ├── services/post-service/     (submodule)
 ├── services/user-service/     (submodule)
 ├── services/shared-lib/       (submodule)
 └── services/swagger-service/  (submodule)
```

Each service is in a **separate repo**, added to the root repo as a **git submodule**.

Below is the **standard workflow** for all service repositories.
Then I explain how to configure the root repo.

---

# ✅ 1. GitHub Actions workflow for each service (post-service, user-service, …)

Create:

```
<service-repo>/.github/workflows/update-root.yml
```

### 📌 Full workflow (copy & run)

```yaml
name: Update Root Repo Submodule Pointer

on:
  push:
    branches:
      - main
      - master

jobs:
  update-root:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout service repository
      uses: actions/checkout@v4

    - name: Checkout root repository
      uses: actions/checkout@v4
      with:
        repository: tqnhu4/microservice     # ROOT REPO
        token: ${{ secrets.ROOT_TOKEN }}    # Your PAT
        path: root-repo

    - name: Update submodule pointer in root repo
      run: |
        cd root-repo/services/$(basename $GITHUB_REPOSITORY)
        git fetch origin
        git checkout $GITHUB_SHA

        cd ../..
        git add services/$(basename $GITHUB_REPOSITORY)
        git config user.name "github-actions"
        git config user.email "github-actions@github.com"

        git commit -m "Update $(basename $GITHUB_REPOSITORY) to $GITHUB_SHA" || echo "No changes to commit"

    - name: Push changes back to root repo
      run: |
        cd root-repo
        git push origin main
      env:
        GITHUB_TOKEN: ${{ secrets.ROOT_TOKEN }}
```

---

# 🧠 What this workflow does

1. Service repo receives a push → workflow triggers
2. Workflow checks out the root repo (`tqnhu4/microservice`)
3. It navigates automatically to the correct service folder:

   For repo `post-service` → `root/services/post-service`
4. It checks out the exact commit SHA (`$GITHUB_SHA`)
5. Commits the updated submodule pointer
6. Pushes to the root repo

→ **Root repo is always instantly updated with the latest version of every service.**

---

# ✅ 2. Setting the ROOT_TOKEN secret (critical)

This PAT is **not** `GITHUB_TOKEN`.

Go to GitHub:

### 1️⃣ Create PAT

* Settings
* Developer Settings
* Personal Access Tokens → Fine-grained
* Give access to:

  * Repository: `tqnhu4/microservice`
* Permissions:

  * **Contents: Read & Write**
  * **Metadata: Read**

Copy the token.

### 2️⃣ Add to every service repo:

```
ROOT_TOKEN = <your PAT>
```

Do this for:

* post-service
* user-service
* shared-lib
* swagger-service

---

# ✅ 3. How to clone the root repo

For contributors:

```bash
git clone https://github.com/tqnhu4/microservice
cd microservice
git submodule update --init --recursive
```

Done — all services are checked out at the correct commit.

---

# ✅ 4. When a service pushes code → root repo updates automatically

Flow:

1. You push to `post-service`
2. Workflow detects commit
3. Updates pointer in `microservice/services/post-service`
4. Commits to root repo
5. Pushes the update

No manual steps required.
