import { Animal } from "./models/Animal";
import { Dog, Cat } from "./models/Dog";
import { Circle, Rectangle } from "./models/Shapes";
import { Container, Repository, HasId, identity, pair } from "./generics/Container";
import { Color, Priority } from "./enums/Color";
import { MathUtils, StringUtils } from "./namespaces/Utils";
import { Point, Direction } from "./types/Point";
import { add, sum, multiply, makeCounter, applyToEach, delayedGreeting } from "./functions/mathUtils";
import { Service } from "./decorators/logger";

class User implements HasId {
  constructor(public id: number, public username: string) {}
}

function main(): void {
  const animals: Animal[] = [new Dog("Rex", 3, "Labrador"), new Cat("Whiskers", 2, "Cat")];
  animals.forEach((a) => console.log(a.describe(), a.makeSound()));

  const shapes = [new Circle(2, Color.Red), new Rectangle(3, 4, Color.Blue)];
  shapes.forEach((s) => console.log(s.describe(), s.area(), s.perimeter()));

  const numbers = new Container<number>();
  numbers.add(1);
  numbers.add(2);
  numbers.forEach((n) => console.log(n));

  const users = new Repository<User>();
  users.save(new User(1, "ada"));
  console.log(users.findById(1));

  console.log(identity("hello"), pair(1, "one"));

  const origin: Point = { x: 0, y: 0 };
  console.log(origin, Direction.North, Priority.High);

  console.log(MathUtils.square(4), MathUtils.Trig.degreesToRadians(180));
  console.log(StringUtils.capitalize("world"));

  console.log(add(2, 3), sum(1, 2, 3), multiply(2, 5));
  const counter = makeCounter();
  console.log(counter(), counter());
  console.log(applyToEach([1, 2, 3], (x) => x * 2));

  delayedGreeting("Moose", 10).then((msg) => console.log(msg));

  const service = new Service();
  console.log(service.process("  HELLO  "));
}

main();
