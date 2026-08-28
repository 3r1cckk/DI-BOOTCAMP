import json
from pathlib import Path


class MenuManager:
    def __init__(self):
        self.file_path = Path(__file__).parent / "restaurant_menu.json"

        with open(self.file_path, "r", encoding="utf-8") as file:
            self.menu = json.load(file)

    def add_item(self, name, price):
        self.menu["items"].append({
            "name": name,
            "price": price
        })

    def remove_item(self, name):
        for item in self.menu["items"]:
            if item["name"].lower() == name.lower():
                self.menu["items"].remove(item)
                return True
        return False

    def save_to_file(self):
        with open(self.file_path, "w", encoding="utf-8") as file:
            json.dump(self.menu, file, indent=4)


def show_restaurant_menu(manager):
    print("\nRestaurant Menu:")

    for item in manager.menu["items"]:
        print(f"{item['name']} - ${item['price']}")


def add_item_to_menu(manager):
    name = input("Enter item name: ")

    try:
        price = float(input("Enter item price: "))
        manager.add_item(name, price)
        print("Item was added successfully.")
    except ValueError:
        print("Invalid price.")


def remove_item_from_menu(manager):
    name = input("Enter item name to remove: ")

    if manager.remove_item(name):
        print("Item was removed successfully.")
    else:
        print("Error: item was not found.")


def main():
    manager = MenuManager()

    while True:
        print("""
Restaurant Menu Manager

1. Show restaurant menu
2. Add item
3. Remove item
4. Exit
""")

        choice = input("Choose an option: ")

        if choice == "1":
            show_restaurant_menu(manager)
        elif choice == "2":
            add_item_to_menu(manager)
        elif choice == "3":
            remove_item_from_menu(manager)
        elif choice == "4":
            manager.save_to_file()
            print("Menu was saved. Goodbye!")
            break
        else:
            print("Invalid choice.")


if __name__ == "__main__":
    main()