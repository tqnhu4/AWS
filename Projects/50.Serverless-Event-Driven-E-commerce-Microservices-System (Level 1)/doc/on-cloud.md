UserService
  └─ publish user.created
        ↓
EventBridge
 ├─ Rule → SQS dev-post-user-created
 ├─ Rule → SQS dev-comment-user-created
 ├─ Rule → SQS dev-notification-user-created


UserService
  └─ publish user.created
        ↓
EventBridge
  └─ Rule:
        source = user-service
        detail-type = user.created
        ↓
SQS (thuộc PostService)


UserService
 ├─ publish user.created
 └─ publish user.updated
        ↓
EventBridge (dev-event-bus)
 ├─ Rule: user.created → SQS dev.post.user.created
 └─ Rule: user.updated → SQS dev.post.user.updated
        ↓
PostService
 ├─ Consumer: user.created
 └─ Consumer: user.updated

 ---------------

 Client
  ↓
API Gateway (HTTP API / REST API)
  ↓
VPC Link
  ↓
NLB (TCP / HTTP)
  ↓
ECS Service (container)

