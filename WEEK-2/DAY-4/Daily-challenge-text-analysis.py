import json
import random
from pathlib import Path


BASE_DIR = Path(__file__).parent
WORDS_FILE = BASE_DIR / "words.txt"
JSON_FILE = BASE_DIR / "modified_data.json"


def get_words_from_file(file_path):
    with open(file_path, "r", encoding="utf-8") as file:
        return file.read().split()


def get_random_sentence(length):
    words = get_words_from_file(WORDS_FILE)
    selected_words = [random.choice(words) for _ in range(length)]
    return " ".join(selected_words).lower()


def random_sentence_generator():
    print("This program generates a random sentence.")

    try:
        length = int(input("Enter sentence length between 2 and 20: "))

        if not 2 <= length <= 20:
            print("Length must be between 2 and 20.")
            return

        print(get_random_sentence(length))

    except ValueError:
        print("Please enter a valid integer.")


def json_exercise():
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

    data["company"]["employee"]["birth_date"] = "1995-06-15"

    with open(JSON_FILE, "w", encoding="utf-8") as file:
        json.dump(data, file, indent=4)

    print(f"Modified JSON saved to {JSON_FILE}")


def main():
    random_sentence_generator()
    json_exercise()


if __name__ == "__main__":
    main()