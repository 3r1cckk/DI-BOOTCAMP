# Exercise 1: Convert lists into a dictionary
keys = ["Ten", "Twenty", "Thirty"]
values = [10, 20, 30]
number_words = dict(zip(keys, values))
print("Exercise 1:", number_words)


# Exercise 2: Cinemax ticket costs
family = {"rick": 43, "beth": 13, "morty": 5, "summer": 8}
total_cost = 0

print("\nExercise 2:")
for name, age in family.items():
    if age < 3:
        ticket_price = 0
    elif age <= 12:
        ticket_price = 10
    else:
        ticket_price = 15

    total_cost += ticket_price
    print(f"{name}: ${ticket_price}")

print(f"Total cost: ${total_cost}")


# Exercise 3: Zara
brand = {
    "name": "Zara",
    "creation_date": 1975,
    "creator_name": "Amancio Ortega Gaona",
    "type_of_clothes": ["men", "women", "children", "home"],
    "international_competitors": ["Gap", "H&M", "Benetton"],
    "number_stores": 7000,
    "major_color": {
        "France": ["blue"],
        "Spain": ["red"],
        "US": ["pink", "green"],
    },
}

brand["number_stores"] = 2
print("\nExercise 3:")
print(f"Zara's clients can find clothes for {', '.join(brand['type_of_clothes'])}.")
brand["country_creation"] = "Spain"

if "international_competitors" in brand:
    brand["international_competitors"].append("Desigual")

brand.pop("creation_date")
print("Last international competitor:", brand["international_competitors"][-1])
print("US major colors:", ", ".join(brand["major_color"]["US"]))
print("Number of keys:", len(brand))
print("Keys:", list(brand.keys()))

more_on_zara = {"creation_date": 1975, "number_stores": 7000}
brand.update(more_on_zara)
print("Merged Zara dictionary:", brand)


# Exercise 4: Disney characters
users = ["Mickey", "Minnie", "Donald", "Ariel", "Pluto"]
characters_to_indices = {character: index for index, character in enumerate(users)}
indices_to_characters = {index: character for index, character in enumerate(users)}
sorted_characters_to_indices = {
    character: index for index, character in enumerate(sorted(users))
}

print("\nExercise 4:")
print("Characters to indices:", characters_to_indices)
print("Indices to characters:", indices_to_characters)
print("Sorted characters to indices:", sorted_characters_to_indices)
