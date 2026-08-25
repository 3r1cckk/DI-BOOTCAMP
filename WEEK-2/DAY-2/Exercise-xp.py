import random


class Pets:
	def __init__(self, animals):
		self.animals = animals

	def walk(self):
		for animal in self.animals:
			print(animal.walk())


class Cat:
	is_lazy = True

	def __init__(self, name, age):
		self.name = name
		self.age = age

	def walk(self):
		return f"{self.name} is just walking around"


class Bengal(Cat):
	def sing(self, sounds):
		return sounds


class Chartreux(Cat):
	def sing(self, sounds):
		return sounds


class Siamese(Cat):
	pass


class Dog:
	def __init__(self, name, age, weight):
		self.name = name
		self.age = age
		self.weight = weight

	def bark(self):
		return f"{self.name} is barking"

	def run_speed(self):
		return self.weight / self.age * 10

	def fight(self, other_dog):
		own_score = self.run_speed() * self.weight
		other_score = other_dog.run_speed() * other_dog.weight

		if own_score > other_score:
			return f"{self.name} won the fight"
		if other_score > own_score:
			return f"{other_dog.name} won the fight"
		return "The fight is a draw"


class PetDog(Dog):
	def __init__(self, name, age, weight):
		super().__init__(name, age, weight)
		self.trained = False

	def train(self):
		print(self.bark())
		self.trained = True

	def play(self, *args):
		dog_names = [dog.name if isinstance(dog, Dog) else str(dog) for dog in args]
		dog_names.insert(0, self.name)
		print(f"{', '.join(dog_names)} all play together")

	def do_a_trick(self):
		if self.trained:
			tricks = [
				"does a barrel roll",
				"stands on his back legs",
				"shakes your hand",
				"plays dead",
			]
			print(f"{self.name} {random.choice(tricks)}")


class Person:
	def __init__(self, first_name, age):
		self.first_name = first_name
		self.age = age
		self.last_name = ""

	def is_18(self):
		return self.age >= 18


class Family:
	def __init__(self, last_name):
		self.last_name = last_name
		self.members = []

	def born(self, first_name, age):
		person = Person(first_name, age)
		person.last_name = self.last_name
		self.members.append(person)

	def check_majority(self, first_name):
		for member in self.members:
			if member.first_name == first_name:
				if member.is_18():
					print(
						"You are over 18, your parents Jane and John accept "
						"that you will go out with your friends"
					)
				else:
					print("Sorry, you are not allowed to go out with your friends.")
				return

	def family_presentation(self):
		print(f"Family {self.last_name}")
		for member in self.members:
			print(f"{member.first_name}, {member.age}")


if __name__ == "__main__":
	all_cats = [Bengal("Milo", 3), Chartreux("Luna", 5), Siamese("Nala", 2)]
	sara_pets = Pets(all_cats)
	sara_pets.walk()

	dog1 = Dog("Rex", 3, 20)
	dog2 = Dog("Buddy", 5, 15)
	dog3 = Dog("Max", 2, 18)
	print(dog1.bark())
	print(dog2.run_speed())
	print(dog1.fight(dog2))
	print(dog3.fight(dog1))

	pet_dog1 = PetDog("Fido", 2, 10)
	pet_dog2 = PetDog("Cooper", 4, 16)
	pet_dog1.train()
	pet_dog1.play(pet_dog2)
	pet_dog1.do_a_trick()

	family = Family("Smith")
	family.born("Jane", 40)
	family.born("John", 42)
	family.born("Alex", 17)
	family.check_majority("Alex")
	family.check_majority("Jane")
	family.family_presentation()
