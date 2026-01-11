
const RedisEventBus = require("./redis/redisEventBus");

function createEventBus() {
  if (process.env.EVENT_BUS_DRIVER === "aws") {
    const AwsEventBus = require("./aws/awsEventBus");
    const AwsSubscriber = require("./aws/awsSubscriber");
    return {
      publisher: new AwsEventBus(),
      subscriber: new AwsSubscriber(),
    };
  }

  const redisBus = new RedisEventBus();
  return {
    publisher: redisBus,
    subscriber: redisBus,
    
  };
}

const { publisher, subscriber } = createEventBus();

const eventBus = {
    publish: (...args) => publisher.publish(...args),
    subscribe: (...args) => subscriber.subscribe(...args),
    start: (...args) => subscriber.start(...args),
};

module.exports = eventBus;
