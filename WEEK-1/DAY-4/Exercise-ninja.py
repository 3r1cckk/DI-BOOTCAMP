# Exercise 1: What's your name?
def get_full_name(first_name, last_name, middle_name=None):
	name_parts = [first_name, middle_name, last_name] if middle_name else [first_name, last_name]
	return " ".join(part.capitalize() for part in name_parts)


print(get_full_name(first_name="john", middle_name="hooker", last_name="lee"))
print(get_full_name(first_name="bruce", last_name="lee"))


# Exercise 2: From English to Morse
MORSE_CODE = {
	"A": ".-", "B": "-...", "C": "-.-.", "D": "-..", "E": ".",
	"F": "..-.", "G": "--.", "H": "....", "I": "..", "J": ".---",
	"K": "-.-", "L": ".-..", "M": "--", "N": "-.", "O": "---",
	"P": ".--.", "Q": "--.-", "R": ".-.", "S": "...", "T": "-",
	"U": "..-", "V": "...-", "W": ".--", "X": "-..-", "Y": "-.--",
	"Z": "--..", "0": "-----", "1": ".----", "2": "..---",
	"3": "...--", "4": "....-", "5": ".....", "6": "-....",
	"7": "--...", "8": "---..", "9": "----.",
}
REVERSE_MORSE_CODE = {code: character for character, code in MORSE_CODE.items()}


def english_to_morse(text):
	morse_words = []
	for word in text.upper().split():
		morse_words.append(" ".join(MORSE_CODE[character] for character in word))
	return " / ".join(morse_words)


def morse_to_english(code):
	words = []
	for word in code.split("/"):
		characters = [REVERSE_MORSE_CODE[letter] for letter in word.split()]
		words.append("".join(characters))
	return " ".join(words)


encoded_message = english_to_morse("Hello World")
print(encoded_message)
print(morse_to_english(encoded_message))


# Exercise 3: Box of stars
def box_printer(*strings):
	longest_string = max(len(string) for string in strings)
	border = "*" * (longest_string + 4)
	print(border)
	for string in strings:
		print(f"* {string.ljust(longest_string)} *")
	print(border)


box_printer("Hello", "World", "in", "reallylongword", "a", "frame")


# Exercise 4: Insertion sort
def insertion_sort(alist):
	for index in range(1, len(alist)):
		current_value = alist[index]
		position = index

		while position > 0 and alist[position - 1] > current_value:
			alist[position] = alist[position - 1]
			position -= 1

		alist[position] = current_value


numbers = [54, 26, 93, 17, 77, 31, 44, 55, 20]
insertion_sort(numbers)
print("Sorted list:", numbers)
