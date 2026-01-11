{
	"Version": "2012-10-17",
	"Statement": [
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
		}
	]
}