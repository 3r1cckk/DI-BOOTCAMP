import json
import random
from pathlib import Path


WORDS_FILE = Path(__file__).parent / "words.txt"


def get_words_from_file(file_path):
    with open(file_path, "r", encoding="utf-8") as file:
        return file.read().split()


def get_random_sentence(sentence_length):
    words = get_words_from_file(WORDS_FILE)
    sentence = [random.choice(words) for _ in range(sentence_length)]
    return " ".join(sentence).lower()


def exercise_1():
    print("This program generates a random sentence.")

    try:
        length = int(input("How many words should the sentence contain? "))

        if not 2 <= length <= 20:
            print("Please enter a number between 2 and 20.")
            return

        print(get_random_sentence(length))

    except ValueError:
        print("Invalid input. Please enter an integer.")
    except FileNotFoundError:
        print(f"Could not find the word list: {WORDS_FILE}")


def exercise_2():
    sample_json = """{
        "company": {
            "employee": {
                "name": "emma",
                "payable": {
                    "salary": 7000,
                    "bonus": 800
                }
            }
        }
    }"""

    data = json.loads(sample_json)

    salary = data["company"]["employee"]["payable"]["salary"]
    print(f"Salary: {salary}")

    data["company"]["employee"]["birth_date"] = "1990-01-01"

    output_file = Path(__file__).parent / "modified_employee.json"

    with open(output_file, "w", encoding="utf-8") as file:
        json.dump(data, file, indent=4)

    print(f"Modified JSON saved to {output_file}")


def main():
    exercise_1()
    exercise_2()


if __name__ == "__main__":
    main()