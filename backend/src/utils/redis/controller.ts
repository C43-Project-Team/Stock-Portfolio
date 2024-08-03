import redis from './connection';

export async function setObject(key: string, obj: any) {
  const value = JSON.stringify(obj);
  await redis.set(key, value);
}

export async function getObject(key: string): Promise<any | null> {
  const value = await redis.get(key);
  if (value) {
    return JSON.parse(value);
  }
  return null;
}

export async function printStoreContents() {
  const keys = await redis.keys('*');
  if (keys.length === 0) {
    console.log('The store is empty.');
    return;
  }

  for (const key of keys) {
    const value = await redis.get(key);
    console.log(`Key: ${key}, Value: ${value}`);
  }
}

export async function clearCache() {
  const keys = await redis.keys('*');
  if (keys.length === 0) {
    console.log('The store is already empty.');
    return;
  }

  for (const key of keys) {
    await redis.del(key);
  }

}

export async function deleteKey(key: string) {
  const result = await redis.del(key);
  if (result === 1) {
    console.log(`Key ${key} deleted successfully.`);
  } else {
    console.log(`Key ${key} does not exist.`);
  }
}