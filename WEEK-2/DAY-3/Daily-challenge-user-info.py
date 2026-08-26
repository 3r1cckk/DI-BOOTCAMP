# User info sorting using lambda

records = []

for _ in range(5):
    name = input("Enter name: ")
    age = int(input("Enter age: "))
    score = int(input("Enter score: "))
    records.append((name, age, score))

# Sort by Name > Age > Score using a lambda
sorted_records = sorted(records, key=lambda x: (x[0], x[1], x[2]))

print(sorted_records)

# Optional demo with the sample values from the exercise
sample = [
    ('bazuuu', 19, 80),
    ('bazuuu', 20, 90),
    ('bazuuu', 17, 91),
    ('bazuuu', 17, 93),
    ('bazuuu', 21, 85),
]
print(sorted(sample, key=lambda x: (x[0], x[1], x[2])))
