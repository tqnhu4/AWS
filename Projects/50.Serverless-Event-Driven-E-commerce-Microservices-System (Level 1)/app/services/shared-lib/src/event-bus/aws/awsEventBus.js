//const AWS = require("aws-sdk");
const {
  EventBridgeClient,
  PutEventsCommand,
} = require("@aws-sdk/client-eventbridge");
const EventBus = require("../eventBus.interface");

class AwsEventBus extends EventBus {
  constructor() {
    super();
    this.client = new EventBridgeClient({
      region: process.env.AWS_REGION,
    });
  }

  async publish(eventType, payload) {
    await this.client.send(new PutEventsCommand({
        Entries: [
          {
            Source: process.env.SERVICE_NAME,
            DetailType: eventType,
            Detail: JSON.stringify(payload),
            EventBusName: process.env.EVENT_BUS_NAME,
          },
        ],
      }));
  }

  // Subscribe handled elsewhere
  async subscribe() {
    throw new Error("Use awsSubscriber instead");
  }
}

module.exports = AwsEventBus;
