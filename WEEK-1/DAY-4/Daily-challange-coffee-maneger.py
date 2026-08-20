# Coffee Shop Menu Manager

menu = {
	"espresso": 7.0,
	"latte": 12.0,
	"cappuccino": 10.0,
}


def show_menu(menu_dict):
	"""Print all drinks and prices."""
	if not menu_dict:
		print("The menu is empty.")
		return

	print("Current menu:")
	for drink, price in menu_dict.items():
		print(f"{drink} - {price}₪")


def get_price(prompt):
	"""Read and validate a non-negative price."""
	try:
		price = float(input(prompt))
	except ValueError:
		print("Invalid price.")
		return None

	if price < 0:
		print("Invalid price.")
		return None
	return price


def add_item(menu_dict):
	"""Add a new drink to the menu."""
	drink = input("Enter new drink name: ").strip()
	if drink in menu_dict:
		print("Item already exists!")
		return

	price = get_price("Enter price: ")
	if price is not None:
		menu_dict[drink] = price
		print(f'"{drink}" added!')


def update_price(menu_dict):
	"""Change the price of an existing drink."""
	drink = input("Which drink do you want to update? ").strip()
	if drink not in menu_dict:
		print("Item not found.")
		return

	price = get_price("Enter the new price: ")
	if price is not None:
		menu_dict[drink] = price
		print("Price updated!")


def delete_item(menu_dict):
	"""Remove a drink from the menu."""
	drink = input("Which drink do you want to delete? ").strip()
	if drink in menu_dict:
		del menu_dict[drink]
		print("Item deleted.")
	else:
		print("Item not found.")


def show_options():
	"""Print the available actions."""
	print("What would you like to do?")
	print("1. Show menu")
	print("2. Add item")
	print("3. Update price")
	print("4. Delete item")
	print("5. Exit")


def run_coffee_shop():
	"""Run the main menu loop."""
	while True:
		show_options()
		choice = input("> ").strip()

		if choice == "1":
			show_menu(menu)
		elif choice == "2":
			add_item(menu)
		elif choice == "3":
			update_price(menu)
		elif choice == "4":
			delete_item(menu)
		elif choice == "5":
			print("Goodbye!")
			break
		else:
			print("Invalid choice, try again.")


run_coffee_shop()
