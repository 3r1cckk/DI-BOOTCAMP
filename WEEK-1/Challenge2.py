# Exercise 1: centered triangle
for stars in range(1, 6, 2):
    spaces = (5 - stars) // 2
    print(" " * spaces + "*" * stars)

print()

# Exercise 1: right-aligned triangle
for stars in range(1, 6):
    print(" " * (5 - stars) + "*" * stars)

print()

# Exercise 1: increasing and decreasing triangle
for stars in range(1, 6):
    print("*" * stars)

for stars in range(5, 0, -1):
    print(" " * (5 - stars) + "*" * stars)


# Exercise 2: selection sort
my_list = [2, 24, 12, 354, 233]

for i in range(len(my_list) - 1):
    minimum = i

    for j in range(i + 1, len(my_list)):
        if my_list[j] < my_list[minimum]:
            minimum = j

    if minimum != i:
        my_list[i], my_list[minimum] = my_list[minimum], my_list[i]

print(my_list)
# Output: [2, 12, 24, 233, 354]