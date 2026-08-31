// ===== DAILY CHALLENGE: Not Bad =====

console.log("--- Daily Challenge: Not Bad ---\n");

// Example 1
let sentence1 = "The movie is not that bad, I like it";
console.log("Original sentence:", sentence1);

// 2. Find the first appearance of "not"
let wordNot1 = sentence1.indexOf("not");
console.log("Position of 'not':", wordNot1);

// 3. Find the first appearance of "bad"
let wordBad1 = sentence1.indexOf("bad");
console.log("Position of 'bad':", wordBad1);

// 4 & 5. Check if "bad" comes after "not" and replace accordingly
let result1;
if (wordNot1 !== -1 && wordBad1 !== -1 && wordBad1 > wordNot1) {
    // If both words exist and "bad" comes after "not"
    result1 = sentence1.substring(0, wordNot1) + "good" + sentence1.substring(wordBad1 + 3);
} else {
    // If "bad" doesn't come after "not" or one of the words is missing
    result1 = sentence1;
}
console.log("Result:", result1);
console.log();

// Example 2
let sentence2 = "This dinner is not that bad ! You cook well";
console.log("Original sentence:", sentence2);

let wordNot2 = sentence2.indexOf("not");
let wordBad2 = sentence2.indexOf("bad");

let result2;
if (wordNot2 !== -1 && wordBad2 !== -1 && wordBad2 > wordNot2) {
    result2 = sentence2.substring(0, wordNot2) + "good" + sentence2.substring(wordBad2 + 3);
} else {
    result2 = sentence2;
}
console.log("Result:", result2);
console.log();

// Example 3
let sentence3 = "This movie is not so bad !";
console.log("Original sentence:", sentence3);

let wordNot3 = sentence3.indexOf("not");
let wordBad3 = sentence3.indexOf("bad");

let result3;
if (wordNot3 !== -1 && wordBad3 !== -1 && wordBad3 > wordNot3) {
    result3 = sentence3.substring(0, wordNot3) + "good" + sentence3.substring(wordBad3 + 3);
} else {
    result3 = sentence3;
}
console.log("Result:", result3);
console.log();

// Example 4
let sentence4 = "This dinner is bad !";
console.log("Original sentence:", sentence4);

let wordNot4 = sentence4.indexOf("not");
let wordBad4 = sentence4.indexOf("bad");

let result4;
if (wordNot4 !== -1 && wordBad4 !== -1 && wordBad4 > wordNot4) {
    result4 = sentence4.substring(0, wordNot4) + "good" + sentence4.substring(wordBad4 + 3);
} else {
    result4 = sentence4;
}
console.log("Result:", result4);
console.log();

// ===== REUSABLE FUNCTION VERSION =====

console.log("--- Reusable Function Version ---\n");

function notBadReplacer(sentence) {
    // Find the first appearance of "not" and "bad"
    const posNot = sentence.indexOf("not");
    const posBad = sentence.indexOf("bad");
    
    // Check if both words exist and "bad" comes after "not"
    if (posNot !== -1 && posBad !== -1 && posBad > posNot) {
        // Replace the substring from "not" to the end of "bad" with "good"
        return sentence.substring(0, posNot) + "good" + sentence.substring(posBad + 3);
    } else {
        // Return original sentence if condition is not met
        return sentence;
    }
}

// Test the function
console.log(notBadReplacer("The movie is not that bad, I like it"));
console.log(notBadReplacer("This dinner is not that bad ! You cook well"));
console.log(notBadReplacer("This movie is not so bad !"));
console.log(notBadReplacer("This dinner is bad !"));
console.log(notBadReplacer("This is good, not bad"));
