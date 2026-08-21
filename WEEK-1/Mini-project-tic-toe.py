def display_board(board):
    for row in board:
        print(" | ".join(row))
        print("-" * 9)


def player_input(board, player):
    while True:
        try:
            row = int(input(f"Player {player}, enter row (1-3): ")) - 1
            column = int(input(f"Player {player}, enter column (1-3): ")) - 1

            if row not in range(3) or column not in range(3):
                print("Enter numbers from 1 to 3.")
            elif board[row][column] != " ":
                print("That position is already taken.")
            else:
                board[row][column] = player
                return

        except ValueError:
            print("Please enter valid numbers.")


def check_win(board, player):
    for row in board:
        if all(cell == player for cell in row):
            return True

    for column in range(3):
        if all(board[row][column] == player for row in range(3)):
            return True

    return (
        all(board[i][i] == player for i in range(3))
        or all(board[i][2 - i] == player for i in range(3))
    )


def check_tie(board):
    return all(cell != " " for row in board for cell in row)


def play():
    board = [[" " for _ in range(3)] for _ in range(3)]
    current_player = "X"

    while True:
        display_board(board)
        player_input(board, current_player)

        if check_win(board, current_player):
            display_board(board)
            print(f"Player {current_player} wins!")
            break

        if check_tie(board):
            display_board(board)
            print("It's a tie!")
            break

        current_player = "O" if current_player == "X" else "X"


play()