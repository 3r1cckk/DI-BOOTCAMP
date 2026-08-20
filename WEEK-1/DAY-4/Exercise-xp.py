import random


# Exercise 1: What Are You Learning?
def display_message():
	print("I am learning about functions in Python.")


display_message()


# Exercise 2: What's Your Favorite Book?
def favorite_book(title):
	print(f"One of my favorite books is {title}.")


favorite_book("Alice in Wonderland")


# Exercise 3: Some Geography
def describe_city(city, country="Unknown"):
	print(f"{city} is in {country}.")


describe_city("Reykjavik", "Iceland")
describe_city("Paris")


# Exercise 4: Random
def compare_numbers(number):
	random_number = random.randint(1, 100)
	if number == random_number:
		print("Success!")
	else:
		print(f"Fail! Your number: {number}, Random number: {random_number}")


compare_numbers(50)


# Exercise 5: Personalized Shirts
def make_shirt(size="large", text="I love Python"):
	print(f"The size of the shirt is {size} and the text is {text}.")


make_shirt()
make_shirt(size="medium")
make_shirt(size="small", text="Custom message")
make_shirt(size="small", text="Hello!")


# Exercise 6: Magicians
def show_magicians(magician_names):
	for magician in magician_names:
		print(magician)


def make_great(magician_names):
	for index in range(len(magician_names)):
		magician_names[index] += " the Great"


magician_names = ["Harry Houdini", "David Blaine", "Criss Angel"]
make_great(magician_names)
show_magicians(magician_names)


# Exercise 7: Temperature Advice
def get_random_temp():
	return random.randint(-10, 40)


def main():
	temperature = get_random_temp()
	print(f"The temperature right now is {temperature} degrees Celsius.")

	if temperature < 0:
		print("Brrr, that's freezing! Wear some extra layers today.")
	elif temperature <= 16:
		print("Quite chilly! Don't forget your coat.")
	elif temperature <= 23:
		print("Nice weather.")
	elif temperature <= 32:
		print("A bit warm, stay hydrated.")
	else:
		print("It's really hot! Stay cool.")


main()
