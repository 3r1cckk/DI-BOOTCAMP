import json
import random
import re
from pathlib import Path


BASE_DIR = Path(__file__).parent
MENU_FILE = BASE_DIR / "restaurant_menu.json"


class MenuManager:
    def __init__(self):
        if MENU_FILE.exists():
            with open(MENU_FILE, "r", encoding="utf-8") as file:
                self.menu = json.load(file)
        else:
            self.menu = {"items": []}

        self.menu.setdefault("valentine_items", [])

    def add_valentine_item(self, name, price):
        if not self.valid_name(name):
            print("Invalid name.")
            return False

        if not re.fullmatch(r"\d{2},14", price):
            print("Invalid price. Use the format XX,14.")
            return False

        self.menu["valentine_items"].append({
            "name": name,
            "price": price
        })

        self.save_to_file()
        print("Item was added successfully.")
        return True

    @staticmethod
    def valid_name(name):
        if len(re.findall(r"e", name, re.IGNORECASE)) < 2:
            return False

        words = name.split()

        if not words or not words[0].startswith("V"):
            return False

        connection_words = {"of", "and", "with", "the", "in"}

        for word in words:
            if word in connection_words:
                continue

            pattern = r"[A-Z][a-z]*(?:-[a-z]+)?"

            if not re.fullmatch(pattern, word):
                return False

        return True

    def save_to_file(self):
        with open(MENU_FILE, "w", encoding="utf-8") as file:
            json.dump(self.menu, file, indent=4)

    def show_menu(self):
        print("""
          **   **
        **  **  **
       **   **   **
        **     **
          ** **
            *
        """)

        print("Restaurant Menu:")

        for item in self.menu["items"]:
            print(f"{item['name']} - ${item['price']}")

        print("\nValentine Menu:")

        for item in self.menu["valentine_items"]:
            print(f"{item['name']} - ${item['price']}")


class Character:
    ABILITIES = [
        "Strength",
        "Dexterity",
        "Constitution",
        "Intelligence",
        "Wisdom",
        "Charisma"
    ]

    def __init__(self, name, age):
        self.name = name
        self.age = age
        self.attributes = self.create_attributes()

    @staticmethod
    def roll_attribute():
        dice = [random.randint(1, 6) for _ in range(4)]
        return sum(sorted(dice)[1:])

    def create_attributes(self):
        return {
            ability: self.roll_attribute()
            for ability in self.ABILITIES
        }

    def to_dict(self):
        return {
            "name": self.name,
            "age": self.age,
            "attributes": self.attributes
        }


class Game:
    def __init__(self):
        self.characters = []

    def create_characters(self):
        while True:
            try:
                players = int(input("How many players are playing? "))

                if players > 0:
                    break

                print("Enter a number greater than zero.")

            except ValueError:
                print("Please enter a valid number.")

        for number in range(1, players + 1):
            print(f"\nPlayer {number}")

            name = input("Enter character name: ")

            while True:
                try:
                    age = int(input("Enter character age: "))
                    break
                except ValueError:
                    print("Please enter a valid age.")

            self.characters.append(Character(name, age))

    def display_characters(self):
        for character in self.characters:
            print(f"\n{character.name}, age {character.age}")

            for ability, score in character.attributes.items():
                print(f"{ability}: {score}")

    def export_json(self):
        with open(BASE_DIR / "characters.json", "w", encoding="utf-8") as file:
            json.dump(
                [character.to_dict() for character in self.characters],
                file,
                indent=4
            )

    def export_txt(self):
        with open(BASE_DIR / "characters.txt", "w", encoding="utf-8") as file:
            for character in self.characters:
                file.write(f"Character: {character.name}\n")
                file.write(f"Age: {character.age}\n")

                for ability, score in character.attributes.items():
                    file.write(f"{ability}: {score}\n")

                file.write("\n")

        print("Characters saved successfully.")


def restaurant_menu_exercise():
    manager = MenuManager()

    while True:
        print("""
1. Show restaurant menu
2. Add Valentine item
3. Return
""")

        choice = input("Choose an option: ")

        if choice == "1":
            manager.show_menu()

        elif choice == "2":
            name = input("Enter Valentine item name: ")
            price = input("Enter price in XX,14 format: ")
            manager.add_valentine_item(name, price)

        elif choice == "3":
            break

        else:
            print("Invalid choice.")


def dungeons_and_dragons_exercise():
    game = Game()
    game.create_characters()
    game.display_characters()
    game.export_json()
    game.export_txt()


def main():
    while True:
        print("""
1. Valentine Restaurant Menu
2. Dungeons & Dragons
3. Exit
""")

        choice = input("Choose an option: ")

        if choice == "1":
            restaurant_menu_exercise()
        elif choice == "2":
            dungeons_and_dragons_exercise()
        elif choice == "3":
            print("Goodbye!")
            break
        else:
            print("Invalid choice.")


if __name__ == "__main__":
    main()