import { Animal } from "./Animal";

export class Dog extends Animal {
  private breed: string;

  constructor(name: string, age: number, breed: string) {
    super(name, age, "Dog");
    this.breed = breed;
  }

  public makeSound(): string {
    return "Woof!";
  }

  public override describe(): string {
    return `${super.describe()} It's a ${this.breed}.`;
  }

  public fetch(item: string): void {
    console.log(`${this.name} fetches the ${item}.`);
  }
}

export class Cat extends Animal {
  public makeSound(): string {
    return "Meow!";
  }
}
