import random

wordslist = [
    "correction",
    "childish",
    "beach",
    "python",
    "assertive",
    "interference",
    "complete",
    "share",
    "credit card",
    "rush",
    "south",
]

word = random.choice(wordslist).lower()
guessed_letters = set()
wrong_guesses = 0
max_wrong_guesses = 6

body_parts = [
    "head",
    "body",
    "left arm",
    "right arm",
    "left leg",
    "right leg",
]

print("Welcome to Hangman!")

while wrong_guesses < max_wrong_guesses:
    display_word = " ".join(
        letter if letter in guessed_letters or letter == " " else "*"
        for letter in word
    )

    print(f"\nWord: {display_word}")
    print(f"Wrong guesses: {wrong_guesses}/{max_wrong_guesses}")

    if all(letter == " " or letter in guessed_letters for letter in word):
        print(f"You won! The word was: {word}")
        break

    guess = input("Guess a letter: ").lower().strip()

    if len(guess) != 1 or not guess.isalpha():
        print("Please enter one letter.")
        continue

    if guess in guessed_letters:
        print("You already guessed that letter.")
        continue

    guessed_letters.add(guess)

    if guess in word:
        print("Correct!")
    else:
        wrong_guesses += 1
        print(f"Wrong! The {body_parts[wrong_guesses - 1]} was added to the gallows.")

else:
    print("\nYou lost!")
    print(f"The word was: {word}")
