class EventBus {
  async publish(eventType, payload) {
    throw new Error("Not implemented");
  }

  async subscribe(eventType, handler) {
    throw new Error("Not implemented");
  }
}

module.exports = EventBus;
