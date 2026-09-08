// Exercise 1: Location
const person = {
	name: 'John Doe',
	age: 25,
	location: {
		country: 'Canada',
		city: 'Vancouver',
		coordinates: [49.2827, -123.1207]
	}
};

const {
	name,
	location: { country, city, coordinates: [lat, lng] }
} = person;

console.log(`I am ${name} from ${city}, ${country}. Latitude(${lat}), Longitude(${lng})`);

// Exercise 2: Display Student Info
function displayStudentInfo({ first, last }) {
	return `Your full name is ${first} ${last}`;
}

console.log(displayStudentInfo({ first: 'Elie', last: 'Schoppik' }));

// Exercise 3: User and ID
const users = { user1: 18273, user2: 92833, user3: 90315 };
const usersArray = Object.entries(users);
const doubledUsersArray = usersArray.map(([user, id]) => [user, id * 2]);

console.log(usersArray);
console.log(doubledUsersArray);

// Exercise 4: Person class
class Person {
	constructor(name) {
		this.name = name;
	}
}

const member = new Person('John');
console.log(typeof member); // object

// Exercise 5: Dog class
class Dog {
	constructor(name) {
		this.name = name;
	}
}

// Option 2 works because a subclass must call super() before using this.
class Labrador extends Dog {
	constructor(name, size) {
		super(name);
		this.size = size;
	}
}

const labrador = new Labrador('Buddy', 'large');
console.log(labrador);

// Exercise 6: Equality and object references
const firstArray = [2];
const secondArray = [2];
const firstObject = {};
const secondObject = {};

console.log(firstArray === secondArray); // false: these are different arrays.
console.log(firstObject === secondObject); // false: these are different objects.

const object1 = { number: 5 };
const object2 = object1;
const object3 = object2;
const object4 = { number: 5 };

object1.number = 4;

console.log(object2.number); // 4
console.log(object3.number); // 4
console.log(object4.number); // 5

// Animal and Mammal classes
class Animal {
	constructor(name, type, color) {
		this.name = name;
		this.type = type;
		this.color = color;
	}
}

class Mammal extends Animal {
	sound(animalSound) {
		return `${animalSound} I'm a ${this.type}, named ${this.name} and I'm ${this.color}`;
	}
}

const farmerCow = new Mammal('Lily', 'cow', 'brown and white');
console.log(farmerCow.sound('Moooo'));

// New Exercise 1: Print Full Name
function printFullName({ first, last }) {
	return `Your full name is ${first} ${last}`;
}

console.log(printFullName({ first: 'Elie', last: 'Schoppik' }));

// New Exercise 2: Keys and Values
function keysAndValues(object) {
	const sortedKeys = Object.keys(object).sort();
	const values = sortedKeys.map((key) => object[key]);

	return [sortedKeys, values];
}

console.log(keysAndValues({ a: 1, b: 2, c: 3 }));
console.log(keysAndValues({ a: 'Apple', b: 'Microsoft', c: 'Google' }));
console.log(keysAndValues({ key1: true, key2: false, key3: undefined }));

// New Exercise 3: Counter class
class Counter {
	constructor() {
		this.count = 0;
	}

	increment() {
		this.count++;
	}
}

const counterOne = new Counter();
counterOne.increment();
counterOne.increment();

const counterTwo = counterOne;
counterTwo.increment();

console.log(counterOne.count); // 3
