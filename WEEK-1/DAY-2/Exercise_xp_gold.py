# Exercise 1: Concatenate lists
list1 = [1, 2, 3]
list2 = [4, 5, 6]
concatenated = list1.copy()
for item in list2:
    concatenated.append(item)
print(concatenated)

# Exercise 2: Range of numbers
for number in range(1500, 2501):
    if number % 5 == 0 and number % 7 == 0:
        print(number)

# Exercise 3: Check the index
names = ['Samus', 'Cortana', 'V', 'Link', 'Mario', 'Cortana', 'Samus']
name = input("Enter a name: ")
if name in names:
    print(names.index(name))
else:
    print(f"{name} is not in the list.")

# Exercise 4: Greatest Number
num1 = int(input("Input the 1st number: "))
num2 = int(input("Input the 2nd number: "))
num3 = int(input("Input the 3rd number: "))
print(f"The greatest number is: {max(num1, num2, num3)}")

# Exercise 5: The Alphabet
alphabet = "abcdefghijklmnopqrstuvwxyz"
for letter in alphabet:
    if letter in "aeiou":
        print(f"{letter} is a vowel")
    else:
        print(f"{letter} is a consonant")

# Exercise 6: Words and letters
words = []
for i in range(7):
    word = input(f"Enter word {i + 1}: ")
    words.append(word)
letter = input("Enter a single character: ")
for word in words:
    if letter in word:
        print(f"{word}: {word.index(letter)}")
    else:
        print(f"{word} does not contain '{letter}'")

# Exercise 7: Min, Max, Sum
numbers = list(range(1, 1000001))
print(min(numbers))
print(max(numbers))
print(sum(numbers))

# Exercise 8: List and Tuple
numbers_input = input("Enter comma-separated numbers: ")
values = numbers_input.split(',')
print(values)
print(tuple(values))

# Exercise 9: Random number
import random

wins = 0
losses = 0
while True:
    guess = input("Guess a number from 1 to 9, or type 'quit' to exit: ")
    if guess.lower() == 'quit':
        print(f"Total wins: {wins}")
        print(f"Total losses: {losses}")
        break

    guess = int(guess)
    secret = random.randint(1, 9)
    if guess == secret:
        print("Winner")
        wins += 1
    else:
        print("Better luck next time")
        losses += 1
