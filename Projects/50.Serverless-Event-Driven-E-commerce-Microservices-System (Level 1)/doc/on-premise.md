Folder Structure



app/
├── docs/                  # Document
├── infra/                 # Terraform, Ansible or Cloud Settings
├── scripts/               
│
└── services/              # (Microservices)
   ├── user-service/
   ├── post-service/
   ├── swagger-service/
   └── shared-lib/

----------------------------------

Github package

app/
│
├── infra/ 
|    └── .npmrc
└── services/
   ├── user-service/
   │   └── .npmrc
   |   └── package.json (dependencies: "@user-name/shared-lib": "1.0.0")
   ├── post-service/
   │   └── .npmrc
   |   └── package.json (dependencies: "@user-name/shared-lib": "1.0.0")
   ├── shared-lib/
   │   └── .npmrc
   |   └── package.json (dependencies: "name": "@user-name/shared-lib",)   
   └── swagger-service/
       └── .npmrc

Get GITHUB_TOKEN

.npmrc
```
@user-name:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Repo
```
https://github.com/user-name/shared-lib
```
----------------------------------

EventBus
----------------------------------
ServiceDiscovery

----------------------------------
Swagger

app/
│
└── services/
   ├── user-service/
   │   └── package.json (dependencies: swagger-ui-express, swagger-jsdoc)
   ├── post-service/
   │   └── package.json (dependencies: swagger-ui-express, swagger-jsdoc)
   ├── shared-lib/
   └── swagger-service/
       └── package.json (dependencies: swagger-ui-express, swagger-jsdoc)       

----------------------------------
Logger

App
 ↓
stdout / file
 ↓
Promtail
 ↓
Loki  (store + index + query)
 ↓
Grafana (UI)
