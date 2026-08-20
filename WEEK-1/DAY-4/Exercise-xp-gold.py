import random


# Exercise 1: When will I retire?
CURRENT_YEAR = 2026
CURRENT_MONTH = 8
CURRENT_DAY = 20


def get_age(year, month, day):
	age = CURRENT_YEAR - year
	if (month, day) > (CURRENT_MONTH, CURRENT_DAY):
		age -= 1
	return age


def can_retire(gender, date_of_birth):
	year, month, day = date_of_birth
	age = get_age(year, month, day)
	retirement_age = 67 if gender.lower() == "m" else 62
	return age >= retirement_age


gender = input("Enter your gender (m/f): ").strip().lower()
while gender not in ("m", "f"):
	gender = input("Please enter 'm' or 'f': ").strip().lower()

date_parts = input("Enter your date of birth (yyyy/mm/dd): ").split("/")
date_of_birth = tuple(int(part) for part in date_parts)
retirement_status = can_retire(gender, date_of_birth)
print("You can retire." if retirement_status else "You cannot retire yet.")


# Exercise 2: Sum
def calculate_sum(number):
	number_as_string = str(number)
	return sum(int(number_as_string * multiplier) for multiplier in range(1, 5))


print("Sum for 3:", calculate_sum(3))


# Exercise 3: Double Dice
def throw_dice():
	return random.randint(1, 6)


def throw_until_doubles():
	throws = 0
	while True:
		first_die = throw_dice()
		second_die = throw_dice()
		throws += 1
		if first_die == second_die:
			return throws


def main():
	results = [throw_until_doubles() for _ in range(100)]
	total_throws = sum(results)
	average_throws = total_throws / len(results)
	print(f"Total throws: {total_throws}")
	print(f"Average throws to reach doubles: {average_throws:.2f}")


main()
