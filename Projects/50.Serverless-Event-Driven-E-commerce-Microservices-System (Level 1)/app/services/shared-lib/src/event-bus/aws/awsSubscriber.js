const {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} = require("@aws-sdk/client-sqs");

class AwsSubscriber {
  constructor() {
    this.client = new SQSClient({
      region: process.env.AWS_REGION,
    });
    this.queueUrl = process.env.EVENT_QUEUE_URL;
    this.handlers = {};
  }

 
 /**
   * Register handler for event type
   */
  subscribe(eventType, handler) {
    this.handlers[eventType] = handler;
  }

  /**
   * Start consuming messages (ONLY ONCE)
   */
  async start() {
    console.log("[AwsSubscriber] Listening SQS...");

    while (true) {
      const res = await this.client.send(
        new ReceiveMessageCommand({
          QueueUrl: this.queueUrl,
          MaxNumberOfMessages: 10,
          WaitTimeSeconds: 20,
        })
      );

      if (!res.Messages) continue;

      for (const msg of res.Messages) {
        try {
          const event = JSON.parse(msg.Body);

          const eventType = event["detail-type"];
          const handler = this.handlers[eventType];

          if (!handler) {
            console.warn("No handler for event:", eventType);
            continue;
          }

          await handler(event.detail);
        } catch (err) {
          console.error("Error handling message", err);
          continue;
        }

        await this.client.send(
          new DeleteMessageCommand({
            QueueUrl: this.queueUrl,
            ReceiptHandle: msg.ReceiptHandle,
          })
        );
      }
    }
  }
}

module.exports = AwsSubscriber;
