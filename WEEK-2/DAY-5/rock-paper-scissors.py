import random


class Game:
    choices = ("rock", "paper", "scissors")

    def get_user_item(self):
        while True:
            item = input("Choose rock, paper, or scissors: ").strip().lower()
            if item in self.choices:
                return item
            print("Invalid choice. Please choose rock, paper, or scissors.")

    def get_computer_item(self):
        return random.choice(self.choices)

    def get_game_result(self, user_item, computer_item):
        if user_item == computer_item:
            return "draw"

        winning_choices = {
            "rock": "scissors",
            "paper": "rock",
            "scissors": "paper",
        }
        return "win" if winning_choices[user_item] == computer_item else "loss"

    def play(self):
        user_item = self.get_user_item()
        computer_item = self.get_computer_item()
        result = self.get_game_result(user_item, computer_item)

        print(f"\nYou chose: {user_item}")
        print(f"Computer chose: {computer_item}")
        print(f"Result: {result}")
        return result


def get_user_menu_choice():
    while True:
        print("\nRock Paper Scissors")
        print("1. Play a new game")
        print("2. Show scores")
        print("3. Quit")
        choice = input("Choose an option: ").strip()

        if choice in ("1", "2", "3"):
            return choice
        print("Invalid choice. Please choose 1, 2, or 3.")


def print_results(results):
    print("\nFinal scores")
    print(f"Wins: {results['win']}")
    print(f"Losses: {results['loss']}")
    print(f"Draws: {results['draw']}")
    print("Thanks for playing!")


def main():
    results = {"win": 0, "loss": 0, "draw": 0}

    while True:
        choice = get_user_menu_choice()

        if choice == "1":
            result = Game().play()
            results[result] += 1
        elif choice == "2":
            print_results(results)
        else:
            print_results(results)
            break


if __name__ == "__main__":
    main()