┌──────────── ECS ────────────┐
│                             │
│  Task Execution Role        │ ← ECS 
│   - Pull ECR                │
│   - CloudWatch Logs         │
│                             │
│  ┌──────── Container ────┐ │
│  │                        │
│  │  Task Role             │ ← App 
│  │   - S3 / DynamoDB      │
│  │   - SQS / SNS          │
│  │                        │
│  └────────────────────────┘ │
└─────────────────────────────┘
