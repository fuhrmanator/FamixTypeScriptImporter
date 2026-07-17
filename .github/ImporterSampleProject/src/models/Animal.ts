export abstract class Animal {
  private static population: number = 0;

  protected name: string;
  private age: number;
  public readonly species: string;

  constructor(name: string, age: number, species: string) {
    this.name = name;
    this.age = age;
    this.species = species;
    Animal.population++;
  }

  public static getPopulation(): number {
    return Animal.population;
  }

  get displayName(): string {
    return `${this.name} (${this.species})`;
  }

  set updatedAge(newAge: number) {
    if (newAge >= 0) {
      this.age = newAge;
    }
  }

  public abstract makeSound(): string;

  public describe(): string {
    return `${this.name} is a ${this.age}-year-old ${this.species}.`;
  }
}
