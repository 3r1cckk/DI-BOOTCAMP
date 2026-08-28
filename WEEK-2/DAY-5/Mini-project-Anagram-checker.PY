from pathlib import Path


class AnagramChecker:
	def __init__(self, word_list_path="sowpods.txt"):
		path = Path(word_list_path)
		if not path.is_absolute():
			path = Path(__file__).parent / path

		if not path.exists():
			raise FileNotFoundError(
				f"Word list not found: {path}. Download SOWPODS and save it as sowpods.txt."
			)

		with path.open("r", encoding="utf-8") as word_list_file:
			self.words = {
				line.strip().lower()
				for line in word_list_file
				if line.strip()
			}

	def is_valid_word(self, word):
		return word.strip().lower() in self.words

	def is_anagram(self, word1, word2):
		first = word1.strip().lower()
		second = word2.strip().lower()
		return first != second and sorted(first) == sorted(second)

	def get_anagrams(self, word):
		return sorted(
			candidate
			for candidate in self.words
			if self.is_anagram(word, candidate)
		)


def get_valid_word():
	while True:
		word = input("Enter a word: ").strip()

		if not word:
			print("Error: please enter a word.")
		elif len(word.split()) != 1:
			print("Error: only one word is allowed.")
		elif not word.isalpha():
			print("Error: only alphabetic characters are allowed.")
		else:
			return word


def main():
	checker = AnagramChecker()

	while True:
		print("\nAnagram Checker")
		print("1. Enter a word")
		print("2. Exit")
		choice = input("Choose an option: ").strip()

		if choice == "2":
			print("Goodbye!")
			break
		if choice != "1":
			print("Error: please choose 1 or 2.")
			continue

		word = get_valid_word()
		anagrams = checker.get_anagrams(word)
		validity = "a valid" if checker.is_valid_word(word) else "not a valid"

		print(f'\nYOUR WORD: "{word.upper()}"')
		print(f"This is {validity} English word.")
		if anagrams:
			print(f"Anagrams for your word: {', '.join(anagrams)}")
		else:
			print("No anagrams found.")


if __name__ == "__main__":
	main()
