export function bindObjectMethods<T extends object>(object: T): T {
  const methods = Object.getOwnPropertyNames(object.constructor.prototype);

  for (const method of methods) {
    if (method !== 'constructor') {
      object[method] = object[method].bind(object);
    }
  }

  return object;
}
