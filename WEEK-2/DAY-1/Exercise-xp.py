# Exercise 1: Cats
class Cat:
    def __init__(self, cat_name, cat_age):
        self.name = cat_name
        self.age = cat_age


cat1 = Cat("Milo", 4)
cat2 = Cat("Luna", 7)
cat3 = Cat("Oscar", 2)


def find_oldest_cat(cat1, cat2, cat3):
    oldest = max([cat1, cat2, cat3], key=lambda cat: cat.age)
    return oldest


oldest_cat = find_oldest_cat(cat1, cat2, cat3)
print(f"The oldest cat is {oldest_cat.name}, and is {oldest_cat.age} years old.")


# Exercise 2: Dogs
class Dog:
    def __init__(self, name, height):
        self.name = name
        self.height = height

    def bark(self):
        print(f"{self.name} goes woof!")

    def jump(self):
        print(f"{self.name} jumps {self.height * 2} cm high!")


davids_dog = Dog("Rex", 50)
sarahs_dog = Dog("Max", 40)

print(f"David's dog: {davids_dog.name}, height = {davids_dog.height} cm")
print(f"Sarah's dog: {sarahs_dog.name}, height = {sarahs_dog.height} cm")

davids_dog.bark()
davids_dog.jump()
sarahs_dog.bark()
sarahs_dog.jump()

if davids_dog.height > sarahs_dog.height:
    print(f"{davids_dog.name} is taller than {sarahs_dog.name}.")
elif sarahs_dog.height > davids_dog.height:
    print(f"{sarahs_dog.name} is taller than {davids_dog.name}.")
else:
    print(f"{davids_dog.name} and {sarahs_dog.name} are the same height.")


# Exercise 3: Who's the song producer?
class Song:
    def __init__(self, lyrics):
        self.lyrics = lyrics

    def sing_me_a_song(self):
        for line in self.lyrics:
            print(line)


stairway = Song([
    "There's a lady who's sure",
    "all that glitters is gold",
    "and she's buying a stairway to heaven"
])

stairway.sing_me_a_song()


# Exercise 4: Afternoon at the Zoo
class Zoo:
    def __init__(self, zoo_name):
        self.name = zoo_name
        self.animals = []

    def add_animal(self, *new_animals):
        for animal in new_animals:
            if animal not in self.animals:
                self.animals.append(animal)

    def get_animals(self):
        print(f"Animals in {self.name}: {self.animals}")

    def sell_animal(self, animal_sold):
        if animal_sold in self.animals:
            self.animals.remove(animal_sold)
            print(f"{animal_sold} has been sold.")
        else:
            print(f"{animal_sold} is not in the zoo.")

    def sort_animals(self):
        sorted_animals = sorted(self.animals)
        grouped_animals = {}
        for animal in sorted_animals:
            first_letter = animal[0].upper()
            grouped_animals.setdefault(first_letter, []).append(animal)
        return grouped_animals

    def get_groups(self):
        groups = self.sort_animals()
        for letter in sorted(groups):
            print(f"{letter}: {groups[letter]}")


brooklyn_safari = Zoo("Brooklyn Safari")
brooklyn_safari.add_animal("Giraffe", "Bear", "Baboon", "Lion", "Zebra", "Cat", "Cougar")
brooklyn_safari.get_animals()
brooklyn_safari.sell_animal("Bear")
brooklyn_safari.get_animals()
print(brooklyn_safari.sort_animals())
brooklyn_safari.get_groups()
