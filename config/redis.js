// config/redis.js
// Mock Redis client for development without Redis server
const mockClient = {
  isOpen: false,
  async connect() {
    this.isOpen = false; // Keep false to disable Redis
    return Promise.resolve();
  },
  async setEx() { return Promise.resolve(); },
  async get() { return Promise.resolve(null); },
  async del() { return Promise.resolve(); },
  on() {}
};

export default mockClient;