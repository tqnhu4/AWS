import json

def lambda_handler(event, context):
    """
    A simple Lambda function that returns "Hello, World!"
    """
    return {
        "statusCode": 200,
        "body": json.dumps({
            "message": "Hello, World from Lambda!",
        }),
        "headers": {
            "Content-Type": "application/json"
        }
    }