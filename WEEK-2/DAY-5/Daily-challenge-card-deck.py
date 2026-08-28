"""OOP quiz and a colorful deck of cards demonstration.

Quiz answers:
    Class: A blueprint that defines data and behavior for objects.
    Instance: A concrete object created from a class.
    Encapsulation: Keeping data and the methods that use it together.
    Abstraction: Showing only the essential details and hiding complexity.
    Inheritance: Creating a class that reuses or extends another class.
    Multiple inheritance: A class inheriting from more than one parent class.
    Polymorphism: Different objects responding to the same method call in their
        own way.
    MRO: Method Resolution Order, the order Python follows to find methods in
        a class and its parent classes.
"""

import random


class Colors:
    RED = "\033[91m"
    BLUE = "\033[94m"
    CYAN = "\033[96m"
    YELLOW = "\033[93m"
    GREEN = "\033[92m"
    BOLD = "\033[1m"
    RESET = "\033[0m"


class Card:
    suits = {
        "Hearts": ("♥", Colors.RED),
        "Diamonds": ("♦", Colors.RED),
        "Clubs": ("♣", Colors.BLUE),
        "Spades": ("♠", Colors.BLUE),
    }

    def __init__(self, suit, value):
        self.suit = suit
        self.value = value

    def __str__(self):
        symbol, color = self.suits[self.suit]
        return f"{color}{self.value:>2} {symbol}{Colors.RESET}"


class Deck:
    values = ("A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K")
    suit_names = ("Hearts", "Diamonds", "Clubs", "Spades")

    def __init__(self):
        self.cards = []
        self._build_deck()

    def _build_deck(self):
        self.cards = [
            Card(suit, value)
            for suit in self.suit_names
            for value in self.values
        ]

    def shuffle(self):
        if len(self.cards) != 52:
            self._build_deck()
        random.shuffle(self.cards)

    def deal(self):
        if not self.cards:
            return None
        return self.cards.pop()


def main():
    print(f"{Colors.BOLD}{Colors.CYAN}╔══════════════════════════════╗")
    print(f"║       COLORFUL CARD DECK     ║")
    print(f"╚══════════════════════════════╝{Colors.RESET}")

    deck = Deck()
    deck.shuffle()
    print(f"\n{Colors.YELLOW}Shuffled deck: {len(deck.cards)} cards{Colors.RESET}")
    print(" ".join(str(card) for card in deck.cards))

    print(f"\n{Colors.GREEN}Dealing three cards...{Colors.RESET}")
    for number in range(1, 4):
        card = deck.deal()
        print(f"  Card {number}: {card}")
    print(f"{Colors.CYAN}Cards remaining: {len(deck.cards)}{Colors.RESET}")


if __name__ == "__main__":
    main()