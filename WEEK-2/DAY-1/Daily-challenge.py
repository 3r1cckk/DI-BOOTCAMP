class Farm:
    def __init__(self, farm_name):
        self.name = farm_name
        self.animals = {}

    def add_animal(self, animal_type=None, count=1, **kwargs):
        if animal_type is not None:
            self.animals[animal_type] = self.animals.get(animal_type, 0) + count

        for animal, quantity in kwargs.items():
            self.animals[animal] = self.animals.get(animal, 0) + quantity

    def get_info(self):
        info = f"{self.name}'s farm\n\n"
        for animal, count in sorted(self.animals.items()):
            info += f"{animal} : {count}\n"
        info += "\n    E-I-E-I-0!"
        return info

    def get_animal_types(self):
        return sorted(self.animals.keys())

    def get_short_info(self):
        animals = self.get_animal_types()
        if not animals:
            return f"{self.name}'s farm has no animals."

        formatted = []
        for animal in animals:
            count = self.animals[animal]
            animal_name = animal if count == 1 else animal + 's'
            formatted.append(animal_name)

        return f"{self.name}'s farm has {', '.join(formatted[:-1]) if len(formatted) > 1 else formatted[0]}" \
               + (f" and {formatted[-1]}" if len(formatted) > 1 else "") + "."


# Test the code
macdonald = Farm("McDonald")
macdonald.add_animal('cow', 5)
macdonald.add_animal('sheep')
macdonald.add_animal('sheep')
macdonald.add_animal('goat', 12)
print(macdonald.get_info())
print()
print(macdonald.get_short_info())
