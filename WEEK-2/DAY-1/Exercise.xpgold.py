import math
import random

# Exercise 1: Geometry
class Circle:
    def __init__(self, radius=1.0):
        self.radius = radius

    def perimeter(self):
        return 2 * math.pi * self.radius

    def area(self):
        return math.pi * self.radius ** 2

    def description(self):
        print(f"A circle is a round geometric figure with radius {self.radius}.")


circle1 = Circle(5)
print(f"Perimeter: {circle1.perimeter()}")
print(f"Area: {circle1.area()}")
circle1.description()

# Exercise 2: Custom List Class
class MyList:
    def __init__(self, letters):
        self.letters = letters

    def reversed_list(self):
        return list(reversed(self.letters))

    def sorted_list(self):
        return sorted(self.letters)

    def random_list(self):
        return [random.randint(0, 100) for _ in range(len(self.letters))]


my_list = MyList(['d', 'b', 'a', 'c'])
print(f"Reversed: {my_list.reversed_list()}")
print(f"Sorted: {my_list.sorted_list()}")
print(f"Random list: {my_list.random_list()}")

# Exercise 3: Restaurant Menu Manager
class MenuManager:
    def __init__(self):
        self.menu = [
            {"name": "Soup", "price": 10, "spice": "B", "gluten": False},
            {"name": "Hamburger", "price": 15, "spice": "A", "gluten": True},
            {"name": "Salad", "price": 18, "spice": "A", "gluten": False},
            {"name": "French Fries", "price": 5, "spice": "C", "gluten": False},
            {"name": "Beef bourguignon", "price": 25, "spice": "B", "gluten": True},
        ]

    def add_item(self, name, price, spice, gluten):
        for dish in self.menu:
            if dish["name"].lower() == name.lower():
                print(f"{name} is already in the menu.")
                return

        self.menu.append({
            "name": name,
            "price": price,
            "spice": spice,
            "gluten": gluten
        })
        print(f"{name} was added to the menu.")

    def update_item(self, name, price, spice, gluten):
        for dish in self.menu:
            if dish["name"].lower() == name.lower():
                dish["price"] = price
                dish["spice"] = spice
                dish["gluten"] = gluten
                print(f"{name} was updated.")
                return

        print(f"{name} is not in the menu.")

    def remove_item(self, name):
        for dish in self.menu:
            if dish["name"].lower() == name.lower():
                self.menu.remove(dish)
                print(f"{name} was removed.")
                print(self.menu)
                return

        print(f"{name} is not in the menu.")


restaurant = MenuManager()
restaurant.add_item("Pizza", 20, "C", False)
restaurant.update_item("Soup", 12, "A", False)
restaurant.remove_item("French Fries")
restaurant.remove_item("Pasta")
