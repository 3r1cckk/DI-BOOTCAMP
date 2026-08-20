number = int(input("Enter a number: "))
length = int(input("Enter the list length: "))

multiples = []
for multiplier in range(1, length + 1):
	multiples.append(number * multiplier)

print(multiples)

user_string = input("Enter a string: ")
without_consecutive_duplicates = ""

for character in user_string:
	if not without_consecutive_duplicates or character != without_consecutive_duplicates[-1]:
		without_consecutive_duplicates += character

print(without_consecutive_duplicates)
