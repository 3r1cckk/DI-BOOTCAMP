import math


# Exercise 1
def insert_item(items, index, item):
    items.insert(index, item)
    return items


# Exercise 2
def count_spaces(text):
    count = 0
    for character in text:
        if character == " ":
            count += 1
    return count


# Exercise 3
def count_case(text):
    uppercase = 0
    lowercase = 0

    for character in text:
        if character.isupper():
            uppercase += 1
        elif character.islower():
            lowercase += 1

    return uppercase, lowercase


# Exercise 4
def my_sum(numbers):
    total = 0
    for number in numbers:
        total += number
    return total


# Exercise 5
def find_max(numbers):
    if not numbers:
        raise ValueError("The list cannot be empty")

    maximum = numbers[0]
    for number in numbers[1:]:
        if number > maximum:
            maximum = number
    return maximum


# Exercise 6
def factorial(number):
    if number < 0:
        raise ValueError("Factorial is not defined for negative numbers")

    result = 1
    for value in range(1, number + 1):
        result *= value
    return result


# Exercise 7
def list_count(items, target):
    count = 0
    for item in items:
        if item == target:
            count += 1
    return count


# Exercise 8
def norm(numbers):
    total = 0
    for number in numbers:
        total += number ** 2
    return math.sqrt(total)


# Exercise 9
def is_mono(numbers):
    increasing = True
    decreasing = True

    for index in range(len(numbers) - 1):
        if numbers[index] > numbers[index + 1]:
            increasing = False
        if numbers[index] < numbers[index + 1]:
            decreasing = False

    return increasing or decreasing


# Exercise 10
def longest_word(words):
    if not words:
        return None

    longest = words[0]
    for word in words[1:]:
        if len(word) > len(longest):
            longest = word

    print(longest)
    return longest


# Exercise 11
def separate_types(items):
    integers = []
    strings = []

    for item in items:
        if type(item) is int:
            integers.append(item)
        elif type(item) is str:
            strings.append(item)

    return integers, strings


# Exercise 12
def is_palindrome(text):
    return text == text[::-1]


# Exercise 13
def sum_over_k(sentence, k):
    count = 0

    for word in sentence.split():
        if len(word) > k:
            count += 1

    return count


# Exercise 14
def dict_avg(dictionary):
    if not dictionary:
        raise ValueError("The dictionary cannot be empty")

    total = 0
    for value in dictionary.values():
        total += value

    return total / len(dictionary)


# Exercise 15
def common_div(number1, number2):
    limit = min(abs(number1), abs(number2))
    divisors = []

    for number in range(2, limit + 1):
        if number1 % number == 0 and number2 % number == 0:
            divisors.append(number)

    return divisors


# Exercise 16
def is_prime(number):
    if number < 2:
        return False

    for divisor in range(2, int(math.sqrt(number)) + 1):
        if number % divisor == 0:
            return False

    return True


# Exercise 17
def weird_print(items):
    result = []

    for index, value in enumerate(items):
        if index % 2 == 0 and value % 2 == 0:
            result.append(value)

    print(result)
    return result


# Exercise 18
def type_count(**kwargs):
    counts = {}

    for value in kwargs.values():
        type_name = type(value).__name__
        counts[type_name] = counts.get(type_name, 0) + 1

    return counts


# Exercise 19
def custom_split(text, separator=None):
    if separator is not None:
        result = []
        current = ""

        for character in text:
            if character == separator:
                result.append(current)
                current = ""
            else:
                current += character

        result.append(current)
        return result

    result = []
    current = ""

    for character in text:
        if character.isspace():
            if current:
                result.append(current)
                current = ""
        else:
            current += character

    if current:
        result.append(current)

    return result


# Exercise 20
def password_format(password):
    return "*" * len(password)


# Examples
print(insert_item([1, 2, 4], 2, 3))
print(count_spaces("hello world Python"))
print(count_case("Hello WORLD"))
print(my_sum([1, 5, 4, 2]))
print(find_max([0, 1, 3, 50]))
print(factorial(4))
print(list_count(["a", "a", "t", "o"], "a"))
print(norm([1, 2, 2]))
print(is_mono([7, 6, 5, 5, 2, 0]))
longest_word(["cat", "elephant", "dog"])
print(separate_types([1, "hello", 2, "world"]))
print(is_palindrome("radar"))
print(sum_over_k("Do or do not there is no try", 2))
print(dict_avg({"a": 1, "b": 2, "c": 8, "d": 1}))
print(common_div(10, 20))
print(is_prime(11))
weird_print([1, 2, 2, 3, 4, 5])
print(type_count(a=1, b="string", c=1.0, d=True, e=False))
print(custom_split("one two three"))
print(password_format("mypassword"))
