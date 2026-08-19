import math
import re

# Exercise 1: Formula
C = 50
H = 30
user_input = input("Enter comma-separated numbers: ")
D_values = [int(value) for value in user_input.split(',')]
results = []

for D in D_values:
    Q = math.sqrt((2 * C * D) / H)
    results.append(str(int(Q)))

print(",".join(results))

# Exercise 2: List of integers
numbers = [3, 47, 99, -80, 22, 97, 54, -23, 5, 7]
print("a. List of numbers:", numbers)
print("b. Sorted descending:", sorted(numbers, reverse=True))
print("c. Sum of all numbers:", sum(numbers))
print("d. First and last numbers:", [numbers[0], numbers[-1]])
print("e. Numbers greater than 50:", [n for n in numbers if n > 50])
print("f. Numbers smaller than 10:", [n for n in numbers if n < 10])
print("g. Numbers squared:", " ".join(str(n ** 2) for n in numbers))
unique_numbers = sorted(set(numbers))
print("h. Numbers without duplicates:", unique_numbers)
print("   Number of unique numbers:", len(unique_numbers))
print("i. Average:", sum(numbers) / len(numbers))
print("j. Largest number:", max(numbers))
print("k. Smallest number:", min(numbers))

# Bonus: manual calculation without built-ins
manual_sum = 0
for n in numbers:
    manual_sum += n
manual_average = manual_sum / len(numbers)
manual_largest = numbers[0]
manual_smallest = numbers[0]
for n in numbers[1:]:
    if n > manual_largest:
        manual_largest = n
    if n < manual_smallest:
        manual_smallest = n
print("Bonus manual sum:", manual_sum)
print("Bonus manual average:", manual_average)
print("Bonus manual largest:", manual_largest)
print("Bonus manual smallest:", manual_smallest)

# Exercise 3: Working on a paragraph
paragraph = (
    "Artificial intelligence is changing the way we live and work. "
    "From healthcare to education, it is helping people solve problems faster and more efficiently. "
    "It can analyze large amounts of data, recognize patterns, and support better decisions. "
    "As technology continues to evolve, society must learn how to use it responsibly and ethically."
)
word_list = re.findall(r"\b\w+\b", paragraph.lower())
unique_words = set(word_list)
sentence_count = len(re.split(r"[.!?]+", paragraph.strip()))
if paragraph.strip() == "":
    sentence_count = 0

print("\nExercise 3")
print(f"Characters: {len(paragraph)}")
print(f"Sentences: {sentence_count}")
print(f"Words: {len(word_list)}")
print(f"Unique words: {len(unique_words)}")
print(f"Non-whitespace characters: {len(paragraph.replace(' ', ''))}")
print(f"Average words per sentence: {len(word_list) / sentence_count}")
print(f"Non-unique words: {len(word_list) - len(unique_words)}")

# Exercise 4: Frequency Of The Words
text = "New to Python or choosing between Python 2 and Python 3? Read Python 2 or Python 3."
word_counts = {}
for word in re.findall(r"\S+", text):
    word_counts[word] = word_counts.get(word, 0) + 1

print("\nExercise 4")
for word, count in sorted(word_counts.items()):
    print(f"{word}:{count}")

