/**
 * Serialization utilities for handling special types like BigInt
 */

/**
 * Recursively converts BigInt values to strings in an object
 * This is necessary because BigInt cannot be directly serialized to JSON
 * @param obj - Object to convert
 * @returns Object with BigInt values converted to strings
 */
export function serializeBigInt<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === "bigint") {
    return String(obj) as T;
  }

  // Handle Date objects - keep them as-is (JSON.stringify handles them)
  if (obj instanceof Date) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => serializeBigInt(item)) as T;
  }

  if (typeof obj === "object") {
    const serialized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      serialized[key] = serializeBigInt(value);
    }
    return serialized as T;
  }

  return obj;
}
