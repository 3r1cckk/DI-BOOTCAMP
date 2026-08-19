# Exercise 1
for _ in range(3):
    print("Hello, World!")

# Exercise 2
result = (99 ** 3) * 8
print(result)

# Exercise 3
print(5 < 3)          # False
print(3 == 3)         # True
print(3 == "3")       # False
# print("3" > 3)      # TypeError: '>' not supported between instances of 'str' and 'int'
print("Hello" == "hello")  # False

# Exercise 4
computer_brand = "Dell"
print(f"I have a {computer_brand} computer.")

# Exercise 5
name = "Erick"
age = 18
shoe_size = 43
info = f"Hi, my name is {name}, I am {age} years old, and my shoe size is {shoe_size}."
print(info)

# Exercise 6
a = 15
b = 10
if a > b:
    print("Hello World")

# Exercise 7
number = int(input("Enter a number: "))
if number % 2 == 0:
    print(f"{number} is even.")
else:
    print(f"{number} is odd.")

# Exercise 8
user_name = input("What is your name? ")
if user_name == "Erick":
    print("Wow, we have the same name! That's hilarious!")
else:
    print(f"{user_name}, nice to meet you! We are not twins... yet.")

# Exercise 9
height = int(input("Enter your height in cm: "))
if height > 145:
    print("You are tall enough to ride!")
else:
    print("You need to grow some more to ride.")
