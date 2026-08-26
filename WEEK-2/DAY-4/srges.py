import random

print("Welcome to the Car Racing Game!")
print("Race to the finish line first!")

track_length = 10
player_name = input("Enter your car name: ")
computer_name = "CPU Racer"

player_position = 0
computer_position = 0

while player_position < track_length and computer_position < track_length:
    move = input("Press Enter to move or type 'quit' to exit: ")
    if move.lower() == 'quit':
        print("You exited the race.")
        break

    player_roll = random.randint(1, 6)
    computer_roll = random.randint(1, 6)

    player_position += player_roll
    computer_position += computer_roll

    print(f"{player_name} rolled {player_roll} and moved to {player_position}.")
    print(f"{computer_name} rolled {computer_roll} and moved to {computer_position}.")

    if player_position >= track_length and computer_position >= track_length:
        print("It's a draw!")
    elif player_position >= track_length:
        print(f"{player_name} wins the race!")
    elif computer_position >= track_length:
        print(f"{computer_name} wins the race!")

print("Game over!")
