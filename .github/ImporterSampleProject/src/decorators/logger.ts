export function Logged(target: Function) {
  console.log(`Class registered: ${target.name}`);
}

export function LogMethod(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const original = descriptor.value;
  descriptor.value = function (...args: unknown[]) {
    console.log(`Calling ${propertyKey} with`, args);
    return original.apply(this, args);
  };
  return descriptor;
}

@Logged
export class Service {
  @LogMethod
  public process(input: string): string {
    return input.trim().toLowerCase();
  }
}
