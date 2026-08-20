sentence = input("Enter a sentence: ").strip()


# Reverse the sentence word by word.
reversed_sentence = " ".join(sentence.split()[::-1])
print(reversed_sentence)
