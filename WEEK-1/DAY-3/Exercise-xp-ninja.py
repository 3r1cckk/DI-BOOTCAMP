manufacturers_string = "Volkswagen, Toyota, Ford Motor, Honda, Chevrolet"
manufacturers = [manufacturer.strip() for manufacturer in manufacturers_string.split(",")]

print(f"There are {len(manufacturers)} manufacturers.")
print("Manufacturers in descending order:", sorted(manufacturers, reverse=True))

manufacturers_with_o = [
	manufacturer for manufacturer in manufacturers if "o" in manufacturer.lower()
]
manufacturers_without_i = [
	manufacturer for manufacturer in manufacturers if "i" not in manufacturer.lower()
]

print(f"Manufacturers with the letter 'o': {len(manufacturers_with_o)}")
print(f"Manufacturers without the letter 'i': {len(manufacturers_without_i)}")

duplicate_manufacturers = [
	"Honda",
	"Volkswagen",
	"Toyota",
	"Ford Motor",
	"Honda",
	"Chevrolet",
	"Toyota",
]
unique_manufacturers = list(dict.fromkeys(duplicate_manufacturers))

print("Companies without duplicates:", ", ".join(unique_manufacturers))
print(f"There are now {len(unique_manufacturers)} companies.")

reversed_manufacturer_names = [
	manufacturer[::-1] for manufacturer in sorted(unique_manufacturers)
]
print("Ascending manufacturers with reversed names:", ", ".join(reversed_manufacturer_names))
