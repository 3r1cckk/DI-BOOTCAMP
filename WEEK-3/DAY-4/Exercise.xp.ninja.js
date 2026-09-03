const mergeWords = (word) => (nextWord) => {
	if (nextWord === undefined) {
		return word;
	}

	return mergeWords(`${word} ${nextWord}`);
};

const mergedHello = mergeWords("Hello")();
const mergedSentence = mergeWords("There")("is")("no")("spoon.")();

document.querySelector("#hello-result").textContent = mergedHello;
document.querySelector("#sentence-result").textContent = mergedSentence;

console.log(mergedHello);
console.log(mergedSentence);
