import re


MATRIX_STR = """
7ir
Tsi
h%x
i ?
sM# 
$a 
#t%
"""

rows = MATRIX_STR.strip("\n").splitlines()
column_count = max(len(row) for row in rows)
matrix = [list(row.ljust(column_count)) for row in rows]

column_stream = ""
for column_index in range(column_count):
	for row in matrix:
		column_stream += row[column_index]

decoded_message = re.sub(r"[^A-Za-z]+", " ", column_stream).strip()
print(decoded_message)
