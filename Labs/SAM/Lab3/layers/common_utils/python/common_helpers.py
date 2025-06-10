import json

def format_response(status_code, body):
    """
    Helper function to format API Gateway responses.
    """
    return {
        "statusCode": status_code,
        "body": json.dumps(body),
        "headers": {
            "Content-Type": "application/json"
        }
    }

def validate_input(data, required_fields):
    """
    Helper function to validate incoming JSON data.
    """
    for field in required_fields:
        if field not in data:
            raise ValueError(f"Missing required field: {field}")
    return True