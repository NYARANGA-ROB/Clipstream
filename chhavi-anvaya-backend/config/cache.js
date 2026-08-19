const Redis = require("ioredis");

const memory = new Map();
let client;
let disabled = false;

const getRedis = () => {
  if (disabled || process.env.NODE_ENV === "test") return null;
  if (!process.env.REDIS_URL) return null;
  if (client) return client;

  try {
    client = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
      lazyConnect: true,
      connectTimeout: 800,
    });
    client.on("error", () => {
      disabled = true;
    });
    client.connect().catch(() => {
      disabled = true;
      client = null;
    });
    return client;
  } catch {
    disabled = true;
    return null;
  }
};

const cacheGet = async (key) => {
  const redis = getRedis();
  if (redis && redis.status === "ready") {
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  }

  const hit = memory.get(key);
  if (hit && hit.exp > Date.now()) return hit.val;
  if (hit) memory.delete(key);
  return null;
};

const cacheSet = async (key, value, ttlSeconds = 30) => {
  const redis = getRedis();
  if (redis && redis.status === "ready") {
    try {
      await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
      return;
    } catch {
      // fall through to memory
    }
  }

  memory.set(key, { val: value, exp: Date.now() + ttlSeconds * 1000 });
};

const cacheDelPrefix = async (prefix) => {
  const redis = getRedis();
  if (redis && redis.status === "ready") {
    try {
      const keys = await redis.keys(`${prefix}*`);
      if (keys.length) await redis.del(keys);
    } catch {
      // ignore
    }
  }

  for (const key of memory.keys()) {
    if (key.startsWith(prefix)) memory.delete(key);
  }
};

module.exports = { cacheGet, cacheSet, cacheDelPrefix };
