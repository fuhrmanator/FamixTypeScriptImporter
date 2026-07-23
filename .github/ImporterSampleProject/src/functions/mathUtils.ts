export function add(a: number, b: number = 0): number {
  return a + b;
}

export function sum(...numbers: number[]): number {
  return numbers.reduce((total, n) => total + n, 0);
}

export const multiply = (a: number, b: number): number => a * b;

export function makeCounter(): () => number {
  let count = 0;
  return () => {
    count += 1;
    return count;
  };
}

export function applyToEach<T, R>(items: T[], fn: (item: T) => R): R[] {
  const results: R[] = [];
  for (const item of items) {
    results.push(fn(item));
  }
  return results;
}

export async function delayedGreeting(name: string, ms: number): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(`Hello, ${name}!`), ms);
  });
}
