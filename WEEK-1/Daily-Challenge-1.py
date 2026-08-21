 # Challenge 1: Sorting
words = input("Enter words separated by commas: ")

sorted_words = words.split(",")
sorted_words.sort()

print(",".join(sorted_words))


# Challenge 2: Longest Word
def longest_word(sentence):
    words = sentence.split()

    if not words:
        return ""

    longest = words[0]

    for word in words[1:]:
        if len(word) > len(longest):
            longest = word

    return longest


print(longest_word("Margaret's toy is a pretty doll."))
print(longest_word("A thing of beauty is a joy forever."))
print(longest_word("Forgetfulness is by all means powerless!"))