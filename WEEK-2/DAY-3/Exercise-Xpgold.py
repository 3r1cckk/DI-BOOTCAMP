import re
from datetime import datetime, timedelta
import random
import string


# Exercise 1: Upcoming Holiday

def upcoming_holiday():
    today = datetime.now().date()
    holidays = {
        "New Year's Day": datetime(today.year, 1, 1).date(),
        "Valentine's Day": datetime(today.year, 2, 14).date(),
        "Easter": datetime(today.year, 4, 1).date(),
        "Independence Day": datetime(today.year, 7, 4).date(),
        "Halloween": datetime(today.year, 10, 31).date(),
        "Christmas": datetime(today.year, 12, 25).date(),
    }

    upcoming = None
    for name, date in holidays.items():
        if date >= today:
            upcoming = (name, date)
            break

    if upcoming is None:
        next_year = today.year + 1
        upcoming = ("New Year's Day", datetime(next_year, 1, 1).date())

    name, date = upcoming
    days_left = (date - today).days
    print(f"Today is {today}. The next holiday is {name} in {days_left} days.")


upcoming_holiday()


# Exercise 2: How Old Are You On Jupiter?

def planet_age(seconds):
    earth_years = seconds / 31557600
    orbital_periods = {
        "Mercury": 0.2408467,
        "Venus": 0.61519726,
        "Earth": 1,
        "Mars": 1.8808158,
        "Jupiter": 11.862615,
        "Saturn": 29.447498,
        "Uranus": 84.016846,
        "Neptune": 164.79132,
    }

    for planet, period in orbital_periods.items():
        age = earth_years / period
        print(f"{planet}: {age:.2f} years")


planet_age(1000000000)


# Exercise 3: Regular Expression #1

def return_numbers(string_value):
    numbers = re.findall(r"\d", string_value)
    return ''.join(numbers)


print(return_numbers('k5k3q2g5z6x9bn'))


# Exercise 4: Regular Expression #2

def validate_full_name(name):
    pattern = r'^[A-Z][a-z]+ [A-Z][a-z]+$'
    if re.fullmatch(pattern, name):
        print("Valid name")
    else:
        print("Invalid name")


validate_full_name('John Doe')


# Exercise 5: Python Password Generator

def valid_password(password):
    if len(password) < 6 or len(password) > 30:
        return False
    has_digit = any(ch.isdigit() for ch in password)
    has_lower = any(ch.islower() for ch in password)
    has_upper = any(ch.isupper() for ch in password)
    has_special = any(ch in string.punctuation for ch in password)
    return has_digit and has_lower and has_upper and has_special


def generate_password(length):
    if not 6 <= length <= 30:
        raise ValueError("Password length must be between 6 and 30 characters.")

    characters = string.ascii_letters + string.digits + string.punctuation
    while True:
        password = ''.join(random.choice(characters) for _ in range(length))
        if valid_password(password):
            return password


def get_valid_length():
    while True:
        try:
            length = int(input("Enter password length (6 to 30): "))
            if 6 <= length <= 30:
                return length
            print("Invalid length. Please enter a number between 6 and 30.")
        except ValueError:
            print("Invalid input. Please enter a number.")


# Test the password generator 100 times
for _ in range(100):
    length = random.randint(6, 30)
    password = generate_password(length)
    assert valid_password(password)
    assert len(password) == length

password_length = get_valid_length()
password = generate_password(password_length)
print(f"Your password is: {password}")
print("Keep it in a safe place!")
