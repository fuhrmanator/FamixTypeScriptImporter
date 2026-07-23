import { ColoredShape } from "../interfaces/Shape";

export class Circle implements ColoredShape {
  readonly name: string = "Circle";
  color: string;
  private radius: number;

  constructor(radius: number, color: string) {
    this.radius = radius;
    this.color = color;
  }

  area(): number {
    return Math.PI * this.radius ** 2;
  }

  perimeter(): number {
    return 2 * Math.PI * this.radius;
  }

  describe(): string {
    return `A ${this.color} circle with radius ${this.radius}.`;
  }
}

export class Rectangle implements ColoredShape {
  readonly name: string = "Rectangle";
  color: string;

  constructor(private width: number, private height: number, color: string) {
    this.color = color;
  }

  area(): number {
    return this.width * this.height;
  }

  perimeter(): number {
    return 2 * (this.width + this.height);
  }

  describe(): string {
    return `A ${this.color} rectangle ${this.width}x${this.height}.`;
  }
}
