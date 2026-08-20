student_grades = {
	"Alice": [88, 92, 100],
	"Bob": [75, 78, 80],
	"Charlie": [92, 90, 85],
	"Dana": [83, 88, 92],
	"Eli": [78, 80, 72],
}

student_averages = {}
for name, grades in student_grades.items():
	student_averages[name] = sum(grades) / len(grades)

student_letter_grades = {}
for name, average in student_averages.items():
	if average >= 90:
		letter_grade = "A"
	elif average >= 80:
		letter_grade = "B"
	elif average >= 70:
		letter_grade = "C"
	elif average >= 60:
		letter_grade = "D"
	else:
		letter_grade = "F"
	student_letter_grades[name] = letter_grade

class_average = sum(student_averages.values()) / len(student_averages)

print("Exercise 1: Student Grade Summary")
print("Student averages:", student_averages)
print("Student letter grades:", student_letter_grades)
print(f"Class average: {class_average:.2f}")
for name in student_grades:
	print(
		f"{name}: Average Grade = {student_averages[name]:.2f}, "
		f"Letter Grade = {student_letter_grades[name]}"
	)


sales_data = [
	{"customer_id": 1, "product": "Smartphone", "price": 600, "quantity": 1, "date": "2023-04-03"},
	{"customer_id": 2, "product": "Laptop", "price": 1200, "quantity": 1, "date": "2023-04-04"},
	{"customer_id": 1, "product": "Laptop", "price": 1000, "quantity": 1, "date": "2023-04-05"},
	{"customer_id": 2, "product": "Smartphone", "price": 500, "quantity": 2, "date": "2023-04-06"},
	{"customer_id": 3, "product": "Headphones", "price": 150, "quantity": 4, "date": "2023-04-07"},
	{"customer_id": 3, "product": "Smartphone", "price": 550, "quantity": 1, "date": "2023-04-08"},
	{"customer_id": 1, "product": "Headphones", "price": 100, "quantity": 2, "date": "2023-04-09"},
]

for transaction in sales_data:
	transaction["total_price"] = transaction["price"] * transaction["quantity"]

total_sales = {}
customer_spending = {}
purchase_counts = {}
product_quantities = {}
transaction_totals = {}

for transaction in sales_data:
	product = transaction["product"]
	customer_id = transaction["customer_id"]
	total_price = transaction["total_price"]

	total_sales[product] = total_sales.get(product, 0) + total_price
	customer_spending[customer_id] = customer_spending.get(customer_id, 0) + total_price
	purchase_counts[customer_id] = purchase_counts.get(customer_id, 0) + 1
	product_quantities[product] = product_quantities.get(product, 0) + transaction["quantity"]
	transaction_totals[product] = transaction_totals.get(product, [])
	transaction_totals[product].append(total_price)

high_value_transactions = sorted(
	[transaction for transaction in sales_data if transaction["total_price"] > 500],
	key=lambda transaction: transaction["total_price"],
	reverse=True,
)
loyal_customers = [customer_id for customer_id, count in purchase_counts.items() if count > 1]
average_transaction_value = {
	product: sum(totals) / len(totals)
	for product, totals in transaction_totals.items()
}
most_popular_product = max(product_quantities, key=product_quantities.get)

print("\nExercise 2: Sales Analysis")
print("Total sales:", total_sales)
print("Customer spending:", customer_spending)
print("Enhanced sales data:", sales_data)
print("High-value transactions:", high_value_transactions)
print("Loyal customers:", loyal_customers)
print("Average transaction value:", average_transaction_value)
print("Product quantities:", product_quantities)
print("Most popular product:", most_popular_product)
