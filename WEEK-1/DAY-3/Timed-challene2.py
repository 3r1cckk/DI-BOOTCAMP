number = int(input("Enter the number: "))

divisor_sum = 0
for divisor in range(1, number):
	if number % divisor == 0:
		divisor_sum += divisor

print(divisor_sum == number)
