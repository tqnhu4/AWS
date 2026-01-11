const { createClient } = require("redis");
const EventBus = require("../eventBus.interface");

class RedisEventBus extends EventBus {
  constructor() {
    super();
    this.pub = createClient({ url: process.env.REDIS_URL });
    this.sub = createClient({ url: process.env.REDIS_URL });
    this.pub.connect();
    this.sub.connect();
  }

  async publish(eventType, payload) {
    await this.pub.publish(
      eventType,
      JSON.stringify(payload)
    );
  }

  async subscribe(eventType, handler) {
    await this.sub.subscribe(eventType, (msg) => {
      handler(JSON.parse(msg));
    });
  }

  start() {}
}

module.exports = RedisEventBus;
