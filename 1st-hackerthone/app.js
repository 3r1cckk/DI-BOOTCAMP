
const $ = (id) => document.getElementById(id);

const screens = [
  "home-screen",
  "lesson-screen",
  "quiz-screen",
  "results-screen"
];

let session = null;
let currentQuestion = 0;
let score = 0;
let answered = false;

function showScreen(id) {
  screens.forEach((screen) => {
    $(screen).classList.toggle("hidden", screen !== id);
  });
}

function setLoading(visible) {
  $("loading").classList.toggle("hidden", !visible);
}

function escapeText(value) {
  return String(value ?? "");
}

$("learn-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  const subject = $("subject").value;
  const topic = $("topic").value.trim();

  $("form-error").textContent = "";

  if (!subject || !topic) {
    $("form-error").textContent =
      "Please choose a subject and enter a topic.";
    return;
  }

  setLoading(true);

  try {
    const response = await fetch("/api/learn", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ subject, topic })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Something went wrong.");
    }

    session = result.data;

    $("lesson-subject").textContent = subject;
    $("lesson-title").textContent = escapeText(session.title);
    $("explanation").textContent = escapeText(session.explanation);
    $("example").textContent = escapeText(session.example);

    $("key-points").innerHTML = "";

    session.key_points.forEach((point) => {
      const li = document.createElement("li");
      li.textContent = point;
      $("key-points").appendChild(li);
    });

    if (result.demo) {
      $("demo-warning").textContent =
        result.warning || "Demo mode: using sample content.";
      $("demo-warning").classList.remove("hidden");
    } else {
      $("demo-warning").classList.add("hidden");
    }

    showScreen("lesson-screen");

  } catch (error) {
    $("form-error").textContent = error.message;
  } finally {
    setLoading(false);
  }
});

$("start-quiz").addEventListener("click", () => {
  currentQuestion = 0;
  score = 0;
  showScreen("quiz-screen");
  renderQuestion();
});

function renderQuestion() {
  answered = false;

  const question = session.questions[currentQuestion];
  const total = session.questions.length;

  $("question-count").textContent =
    `Question ${currentQuestion + 1} of ${total}`;

  $("progress").style.width =
    `${((currentQuestion + 1) / total) * 100}%`;

  $("question-text").textContent = question.question;
  $("options").innerHTML = "";
  $("answer-feedback").textContent = "";

  $("next-question").disabled = true;
  $("next-question").textContent =
    currentQuestion === total - 1
      ? "See my results →"
      : "Next question →";

  question.options.forEach((option, index) => {
    const button = document.createElement("button");

    button.className = "option-btn";
    button.textContent = `${String.fromCharCode(65 + index)}. ${option}`;

    button.addEventListener("click", () => {
      chooseAnswer(index);
    });

    $("options").appendChild(button);
  });
}

function chooseAnswer(selectedIndex) {
  if (answered) return;

  answered = true;

  const question = session.questions[currentQuestion];
  const buttons = $("options").querySelectorAll("button");
  const correctIndex = question.answer;

  if (selectedIndex === correctIndex) {
    score++;
  }

  buttons.forEach((button, index) => {
    button.disabled = true;

    if (index === correctIndex) {
      button.classList.add("correct");
    }

    if (index === selectedIndex && selectedIndex !== correctIndex) {
      button.classList.add("wrong");
    }
  });

  $("answer-feedback").textContent =
    (selectedIndex === correctIndex ? "Correct! " : "Not quite. ") +
    question.explanation;

  $("next-question").disabled = false;
}

$("next-question").addEventListener("click", () => {
  if (!answered) return;

  if (currentQuestion < session.questions.length - 1) {
    currentQuestion++;
    renderQuestion();
  } else {
    showResults();
  }
});

function showResults() {
  const total = session.questions.length;
  const percentage = Math.round((score / total) * 100);

  $("score-title").textContent = `${score}/${total}`;
  $("score-text").textContent =
    `You scored ${percentage}%.`;

  if (percentage >= 80) {
    $("revision-tip").textContent =
      "Great work! Try another topic or explain what you learned to someone else.";
  } else if (percentage >= 50) {
    $("revision-tip").textContent =
      "Good progress. Review the key points and try the quiz again.";
  } else {
    $("revision-tip").textContent =
      "Keep practicing. Read the explanation again and review each question.";
  }

  showScreen("results-screen");
}

$("back-home").addEventListener("click", () => {
  showScreen("home-screen");
});

$("try-again").addEventListener("click", () => {
  $("learn-form").reset();
  $("demo-warning").classList.add("hidden");
  showScreen("home-screen");
});