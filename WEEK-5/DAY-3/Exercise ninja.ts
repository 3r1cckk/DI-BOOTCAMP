export
/*
==========================================
EXERCISE 1: CLASS INHERITANCE
WITH PROTECTED ACCESS MODIFIERS
==========================================
*/

class Employee {
  protected name: string;
  protected salary: number;

  constructor(name: string, salary: number) {
    this.name = name;
    this.salary = salary;
  }

  public getDetails(): string {
    return `Name: ${this.name}, Salary: ${this.salary}`;
  }
}

class Manager extends Employee {
  public department: string;

  constructor(
    name: string,
    salary: number,
    department: string
  ) {
    super(name, salary);
    this.department = department;
  }

  public override getDetails(): string {
    return `Name: ${this.name}, Salary: ${this.salary}, Department: ${this.department}`;
  }
}

const manager = new Manager(
  "John",
  80000,
  "IT"
);

console.log("EXERCISE 1");
console.log(manager.getDetails());


/*
==========================================
EXERCISE 2: READONLY WITH ACCESS MODIFIERS
==========================================
*/

class Car {
  public readonly make: string;
  private readonly model: string;
  public year: number;

  constructor(
    make: string,
    model: string,
    year: number
  ) {
    this.make = make;
    this.model = model;
    this.year = year;
  }

  public getCarDetails(): string {
    return `Make: ${this.make}, Model: ${this.model}, Year: ${this.year}`;
  }
}

const car = new Car(
  "Toyota",
  "Corolla",
  2024
);

console.log("\nEXERCISE 2");
console.log(car.getCarDetails());

// year is public, so it can be changed
car.year = 2025;

console.log(car.getCarDetails());

// These produce TypeScript errors:
// car.make = "Honda";
// car.model = "Civic";


/*
==========================================
EXERCISE 3: STATIC PROPERTIES AND METHODS
==========================================
*/

class MathUtils {
  public static PI: number = 3.14159;

  public static circumference(
    radius: number
  ): number {
    return 2 * MathUtils.PI * radius;
  }
}

console.log("\nEXERCISE 3");

console.log(
  "PI:",
  MathUtils.PI
);

console.log(
  "Circumference:",
  MathUtils.circumference(10)
);


/*
==========================================
EXERCISE 4: INTERFACE WITH FUNCTION TYPES
==========================================
*/

interface Operation {
  calculate(a: number, b: number): number;
}

class Addition implements Operation {
  public calculate(
    a: number,
    b: number
  ): number {
    return a + b;
  }
}

class Multiplication implements Operation {
  public calculate(
    a: number,
    b: number
  ): number {
    return a * b;
  }
}

const addition = new Addition();
const multiplication = new Multiplication();

console.log("\nEXERCISE 4");

console.log(
  "Addition:",
  addition.calculate(10, 5)
);

console.log(
  "Multiplication:",
  multiplication.calculate(10, 5)
);


/*
==========================================
EXERCISE 5: EXTENDING INTERFACES
WITH READONLY PROPERTIES
==========================================
*/

interface Shape {
  color: string;
  getArea(): number;
}

interface Rectangle extends Shape {
  readonly width: number;
  readonly height: number;
  getPerimeter(): number;
}

class RectangleShape implements Rectangle {
  public color: string;
  public readonly width: number;
  public readonly height: number;

  constructor(
    color: string,
    width: number,
    height: number
  ) {
    this.color = color;
    this.width = width;
    this.height = height;
  }

  public getArea(): number {
    return this.width * this.height;
  }

  public getPerimeter(): number {
    return 2 * (this.width + this.height);
  }
}

const rectangle = new RectangleShape(
  "Blue",
  10,
  5
);

console.log("\nEXERCISE 5");

console.log("Color:", rectangle.color);
console.log("Width:", rectangle.width);
console.log("Height:", rectangle.height);
console.log("Area:", rectangle.getArea());
console.log("Perimeter:", rectangle.getPerimeter());

// These produce TypeScript errors:
// rectangle.width = 20;
// rectangle.height = 10;