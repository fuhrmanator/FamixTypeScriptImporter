export namespace MathUtils {
  export const PI_APPROX = 3.14159;

  export function square(x: number): number {
    return x * x;
  }

  export function cube(x: number): number {
    return x * x * x;
  }

  export namespace Trig {
    export function degreesToRadians(deg: number): number {
      return (deg * PI_APPROX) / 180;
    }
  }
}

export namespace StringUtils {
  export function capitalize(s: string): string {
    return s.length === 0 ? s : s[0].toUpperCase() + s.slice(1);
  }

  export function reverse(s: string): string {
    return s.split("").reverse().join("");
  }
}
