# Exercise 1: Currencies
class Currency:
    def __init__(self, currency, amount):
        self.currency = currency
        self.amount = amount

    def __str__(self):
        label = self.currency if self.amount == 1 else f"{self.currency}s"
        return f"{self.amount} {label}"

    def __repr__(self):
        return self.__str__()

    def __int__(self):
        return self.amount

    def __add__(self, other):
        if isinstance(other, Currency):
            if self.currency != other.currency:
                raise TypeError(f"Cannot add between Currency type <{self.currency}> and <{other.currency}>")
            return self.amount + other.amount
        if isinstance(other, int):
            return self.amount + other
        return NotImplemented

    def __iadd__(self, other):
        if isinstance(other, Currency):
            if self.currency != other.currency:
                raise TypeError(f"Cannot add between Currency type <{self.currency}> and <{other.currency}>")
            self.amount += other.amount
            return self
        if isinstance(other, int):
            self.amount += other
            return self
        return NotImplemented


# Exercise 1 demo
c1 = Currency('dollar', 5)
c2 = Currency('dollar', 10)
c3 = Currency('shekel', 1)

print(c1)
print(int(c1))
print(repr(c1))
print(c1 + 5)
print(c1 + c2)
print(c1)
c1 += 5
print(c1)
c1 += c2
print(c1)
# print(c1 + c3)

# Exercise 2: Import
try:
    from func import sum_numbers
except ModuleNotFoundError:
    from .func import sum_numbers

sum_numbers(10, 5)

# Exercise 3: String module
import random
import string


def generate_random_string(length=5):
    letters = string.ascii_letters
    return ''.join(random.choice(letters) for _ in range(length))


print(generate_random_string())

# Exercise 4: Current Date
from datetime import datetime


def display_current_date():
    today = datetime.now().date()
    print(today)


display_current_date()

# Exercise 5: Amount of time left until January 1st

def time_until_jan_1st():
    now = datetime.now()
    next_year = datetime(now.year + 1, 1, 1)
    remaining = next_year - now
    print(remaining)


time_until_jan_1st()

# Exercise 6: Birthday and minutes

def minutes_lived(birthday):
    birth_date = datetime.strptime(birthday, '%Y-%m-%d')
    now = datetime.now()
    total_minutes = (now - birth_date).total_seconds() / 60
    print(f"You have lived approximately {total_minutes:.0f} minutes.")


minutes_lived('1998-05-20')

# Exercise 7: Faker Module
try:
    from faker import Faker
except ImportError:
    print("Please install faker with: pip install faker")
    Faker = None


users = []


def add_users(number_of_users):
    if Faker is None:
        return
    fake = Faker()
    for _ in range(number_of_users):
        user = {
            'name': fake.name(),
            'address': fake.address(),
            'language_code': fake.language_code(),
        }
        users.append(user)
    print(users)


add_users(3)
