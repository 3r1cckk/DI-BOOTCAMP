# Exercise 1: Favorite Numbers

def exercise_1():
    my_fav_numbers = {7, 11, 23}
    my_fav_numbers.add(42)
    my_fav_numbers.add(99)
    my_fav_numbers.remove(99)

    friend_fav_numbers = {3, 7, 18, 21}
    our_fav_numbers = my_fav_numbers.union(friend_fav_numbers)

    print("My favorite numbers:", my_fav_numbers)
    print("Friend's favorite numbers:", friend_fav_numbers)
    print("Our favorite numbers:", our_fav_numbers)


# Exercise 2: Tuple

def exercise_2():
    numbers = (1, 2, 3, 4)
    print("Original tuple:", numbers)
    try:
        numbers[0] = 10
    except TypeError as e:
        print("Tuples are immutable:", e)

    numbers = numbers + (5, 6)
    print("New tuple after concatenation:", numbers)


# Exercise 3: List Manipulation

def exercise_3():
    basket = ["Banana", "Apples", "Oranges", "Blueberries"]
    basket.remove("Banana")
    basket.remove("Blueberries")
    basket.append("Kiwi")
    basket.insert(0, "Apples")
    print("Apples count:", basket.count("Apples"))
    basket.clear()
    print("Final basket:", basket)


# Exercise 4: Floats

def exercise_4():
    mixed_numbers = [n / 2 if n % 2 else int(n / 2) for n in range(3, 11)]
    print("Mixed numbers:", mixed_numbers)


# Exercise 5: For Loop

def exercise_5():
    print("Numbers from 1 to 20:")
    for number in range(1, 21):
        print(number)

    print("\nNumbers with even index:")
    for index, number in enumerate(range(1, 21)):
        if index % 2 == 0:
            print(number)


# Exercise 6: While Loop

def exercise_6():
    while True:
        name = input("Enter your name: ")
        if name.isdigit() or len(name) < 3:
            print("Invalid input. Please enter a proper name with at least 3 letters.")
            continue
        print("thank you")
        break


# Exercise 7: Favorite Fruits

def exercise_7():
    fruits = input("Enter your favorite fruits separated by spaces: ").split()
    chosen_fruit = input("Enter the name of any fruit: ")

    if chosen_fruit in fruits:
        print("You chose one of your favorite fruits! Enjoy!")
    else:
        print("You chose a new fruit. I hope you enjoy it!")


# Exercise 8: Pizza Toppings

def exercise_8():
    toppings = []
    while True:
        topping = input("Enter a topping (or 'quit' to finish): ")
        if topping.lower() == "quit":
            break
        toppings.append(topping)
        print(f"Adding {topping} to your pizza.")

    total_cost = 10 + len(toppings) * 2.5
    print("Your toppings:", toppings)
    print(f"Total cost: ${total_cost:.2f}")


# Exercise 9: Cinemax Tickets

def exercise_9():
    family_ages = []
    while True:
        age_input = input("Enter family member age (or 'done' to finish): ")
        if age_input.lower() == "done":
            break
        family_ages.append(int(age_input))

    total_cost = 0
    for age in family_ages:
        if age < 3:
            total_cost += 0
        elif age <= 12:
            total_cost += 10
        else:
            total_cost += 15

    print("Total ticket cost: $", total_cost)

    # Bonus: restricted movie for ages 16-21
    teen_ages = []
    while True:
        teen_age = input("Enter age for restricted movie check (or 'done' to finish): ")
        if teen_age.lower() == "done":
            break
        age = int(teen_age)
        if 16 <= age <= 21:
            teen_ages.append(age)

    print("Final attendees for the restricted movie:", teen_ages)


if __name__ == "__main__":
    print("Exercise 1")
    exercise_1()
    print("\nExercise 2")
    exercise_2()
    print("\nExercise 3")
    exercise_3()
    print("\nExercise 4")
    exercise_4()
    print("\nExercise 5")
    exercise_5()
    print("\nExercise 6")
    exercise_6()
    print("\nExercise 7")
    exercise_7()
    print("\nExercise 8")
    exercise_8()
    print("\nExercise 9")
    exercise_9()
