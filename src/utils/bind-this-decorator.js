export default function (target, key, descriptor) {
  descriptor = descriptor || target.descriptor;
  let fn = descriptor.value;
  if (typeof fn !== 'function') {
    throw new SyntaxError(`@autobind can only be used on functions, not: ${fn}`);
  }
  descriptor.value = fn.bind(target);
  return descriptor;
} 