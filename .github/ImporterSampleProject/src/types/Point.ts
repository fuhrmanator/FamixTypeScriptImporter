export type Point = {
  x: number;
  y: number;
};

export type Id = string | number;

export type Callback<T> = (value: T) => void;

export enum Direction {
  North,
  South,
  East,
  West
}
