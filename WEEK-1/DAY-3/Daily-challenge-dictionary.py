word = input("Enter a word: ")
letter_indices = {}

for index, letter in enumerate(word):
	if letter in letter_indices:
		letter_indices[letter].append(index)
	else:
		letter_indices[letter] = [index]

print("Letter indices:", letter_indices)


items_purchase = {
	"Water": "$1",
	"Bread": "$3",
	"TV": "$1,000",
	"Fertilizer": "$20",
}
wallet = "$300"

remaining_money = int(wallet.replace("$", "").replace(",", ""))
basket = []

for item, price in items_purchase.items():
	item_price = int(price.replace("$", "").replace(",", ""))
	if item_price <= remaining_money:
		basket.append(item)
		remaining_money -= item_price

if basket:
	print("Affordable items:", sorted(basket))
else:
	print("Affordable items: Nothing")
