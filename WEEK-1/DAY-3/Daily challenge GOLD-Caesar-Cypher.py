def caesar_cipher(message, shift):
	encrypted_message = ""

	for character in message:
		if character.isupper():
			first_letter = ord("A")
			encrypted_message += chr(
				(ord(character) - first_letter + shift) % 26 + first_letter
			)
		elif character.islower():
			first_letter = ord("a")
			encrypted_message += chr(
				(ord(character) - first_letter + shift) % 26 + first_letter
			)
		else:
			encrypted_message += character

	return encrypted_message


mode = input("Do you want to encrypt or decrypt? ").strip().lower()
while mode not in ("encrypt", "decrypt"):
	mode = input("Please enter 'encrypt' or 'decrypt': ").strip().lower()

message = input("Enter your message: ")
shift = int(input("Enter the shift: "))

if mode == "decrypt":
	shift = -shift

result = caesar_cipher(message, shift)
print("Result:", result)
