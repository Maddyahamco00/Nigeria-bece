// services/cacheService.js
import redisClient from '../config/redis.js';

class CacheService {
  async set(key, value, expiration = 3600) {
    try {
      if (!redisClient.isOpen) return false;
      await redisClient.setEx(key, expiration, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async get(key) {
    try {
      if (!redisClient.isOpen) return null;
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async del(key) {
    try {
      if (!redisClient.isOpen) return false;
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  async setStudentRegData(studentId, data) {
    return this.set(`student_reg:${studentId}`, data, 1800); // 30 minutes
  }

  async getStudentRegData(studentId) {
    return this.get(`student_reg:${studentId}`);
  }

  async setPaymentData(reference, data) {
    return this.set(`payment:${reference}`, data, 3600); // 1 hour
  }

  async getPaymentData(reference) {
    return this.get(`payment:${reference}`);
  }

  async cacheStates() {
    const { State } = await import('../models/index.js');
    const states = await State.findAll();
    return this.set('states', states, 86400); // 24 hours
  }

  async getCachedStates() {
    return this.get('states');
  }
}

export default new CacheService();