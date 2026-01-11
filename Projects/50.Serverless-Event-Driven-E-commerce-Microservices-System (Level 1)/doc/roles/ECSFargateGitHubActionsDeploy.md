{
	"Version": "2012-10-17",
	"Statement": [
		{
			"Sid": "ECSRegisterAndDeploy",
			"Effect": "Allow",
			"Action": [
				"ecs:RegisterTaskDefinition",
				"ecs:DeregisterTaskDefinition",
				"ecs:DescribeTaskDefinition",
				"ecs:UpdateService",
				"ecs:DescribeServices",
				"ecs:DescribeClusters"
			],
			"Resource": "*"
		},
		{
			"Sid": "PassTaskExecutionRole",
			"Effect": "Allow",
			"Action": "iam:PassRole",
			"Resource": [
				"arn:aws:iam::218496845315:role/ecsTaskExecutionRole"
			]
		},
		{
			"Sid": "PassTaskRole",
			"Effect": "Allow",
			"Action": "iam:PassRole",
			"Resource": [
				"arn:aws:iam::218496845315:role/ecsTaskRole"
			]
		},
		{
			"Sid": "ECRAccess",
			"Effect": "Allow",
			"Action": [
				"ecr:GetAuthorizationToken",
				"ecr:BatchCheckLayerAvailability",
				"ecr:GetDownloadUrlForLayer",
				"ecr:BatchGetImage",
				"ecr:PutImage",
				"ecr:InitiateLayerUpload",
				"ecr:UploadLayerPart",
				"ecr:CompleteLayerUpload"
			],
			"Resource": "*"
		},
		{
			"Effect": "Allow",
			"Action": [
				"servicediscovery:ListServices",
				"servicediscovery:GetService",
				"servicediscovery:ListInstances",
				"servicediscovery:GetInstance",
				"servicediscovery:RegisterInstance",
				"servicediscovery:DeregisterInstance"
			],
			"Resource": "*"
		},
		{
			"Effect": "Allow",
			"Action": [
				"events:PutEvents"
			],
			"Resource": "*"
		},
		{
			"Effect": "Allow",
			"Action": [
				"sqs:ReceiveMessage",
				"sqs:DeleteMessage",
				"sqs:GetQueueAttributes"
			],
			"Resource": "*"
		},
		{
			"Effect": "Allow",
			"Action": [
				"ecs:ListClusters",
				"ecs:ListServices",
				"ecs:ListTasks",
				"ecs:DescribeClusters",
				"ecs:DescribeServices",
				"ecs:DescribeTasks",
				"ecs:UpdateService",
				"ecs:RegisterTaskDefinition"
			],
			"Resource": "*"
		}
	]
}