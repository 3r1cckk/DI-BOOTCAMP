const libForm = document.querySelector("#libform");
const storyElement = document.querySelector("#story");
const shuffleButton = document.querySelector("#shuffle-button");
let currentWords = null;
let lastStoryIndex = -1;

const storyTemplates = [
	({ noun, adjective, person, verb, place }) =>
		`${person} found a ${adjective} ${noun} in ${place} and decided to ${verb} with it before breakfast.`,
	({ noun, adjective, person, verb, place }) =>
		`In ${place}, ${person} became the world's most ${adjective} hero after learning to ${verb} a giant ${noun}.`,
	({ noun, adjective, person, verb, place }) =>
		`Nobody expected ${person} to ${verb} the ${adjective} ${noun} through ${place}, but it made a wonderful story.`,
];

function getWords() {
	return {
		noun: document.querySelector("#noun").value.trim(),
		adjective: document.querySelector("#adjective").value.trim(),
		person: document.querySelector("#person").value.trim(),
		verb: document.querySelector("#verb").value.trim(),
		place: document.querySelector("#place").value.trim(),
	};
}

function chooseStory() {
	let storyIndex;
	do {
		storyIndex = Math.floor(Math.random() * storyTemplates.length);
	} while (storyIndex === lastStoryIndex && storyTemplates.length > 1);

	lastStoryIndex = storyIndex;
	storyElement.textContent = storyTemplates[storyIndex](currentWords);
}

libForm.addEventListener("submit", (event) => {
	event.preventDefault();
	const words = getWords();

	if (Object.values(words).some((word) => word === "")) {
		storyElement.textContent = "Please fill in every field to create a story.";
		return;
	}

	currentWords = words;
	chooseStory();
	shuffleButton.disabled = false;
});

shuffleButton.addEventListener("click", chooseStory);
