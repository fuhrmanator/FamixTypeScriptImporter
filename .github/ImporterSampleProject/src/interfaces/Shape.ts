export interface Shape {
  readonly name: string;
  area(): number;
  perimeter(): number;
}

export interface Colored {
  color: string;
}

// interface extending multiple interfaces
export interface ColoredShape extends Shape, Colored {
  describe(): string;
}
