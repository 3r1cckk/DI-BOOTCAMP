
import json
import os

from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request
from openai import OpenAI

load_dotenv()

app = Flask(__name__)

API_KEY = os.getenv("OPENAI_API_KEY")
MODEL = os.getenv("OPENAI_MODEL", "gpt-5.6-luna")

client = OpenAI(api_key=API_KEY) if API_KEY else None


def create_learning_prompt(subject, topic):
    return f"""
You are SomaSmart, an educational tutor for secondary school students.

Subject: {subject}
Topic: {topic}

Create a learning session that helps the student understand
the topic and practice it.

Return ONLY valid JSON with this exact structure:
{{
  "title": "string",
  "explanation": "string",
  "key_points": ["string", "string", "string"],
  "example": "string",
  "questions": [
    {{
      "question": "string",
      "options": ["A", "B", "C", "D"],
      "answer": 0,
      "explanation": "string"
    }}
  ]
}}

Rules:
- Create exactly 5 multiple-choice questions.
- Each question has exactly 4 options.
- "answer" is the zero-based correct option index.
- Use clear, age-appropriate language.
- Do not invent facts.
- Keep the explanation concise and useful.
- If the topic is unclear, explain the ambiguity in the
  explanation and create safe, general practice questions.
"""


def fallback_session(subject, topic):
    return {
        "title": topic,
        "explanation": (
            f"This is a demo learning session about {topic} "
            f"in {subject}. Connect the AI backend to generate "
            "a personalized explanation."
        ),
        "key_points": [
            "Understand the main definition.",
            "Identify the important causes or features.",
            "Practice explaining the topic in your own words."
        ],
        "example": "Ask your teacher for a real-life example.",
        "questions": [
            {
                "question": "What should you do first when learning a new topic?",
                "options": [
                    "Understand the main idea",
                    "Skip the topic",
                    "Memorize without understanding",
                    "Do nothing"
                ],
                "answer": 0,
                "explanation": "Understanding the main idea is a useful first step."
            },
            {
                "question": "Which action helps revision?",
                "options": [
                    "Never practicing",
                    "Testing yourself",
                    "Ignoring mistakes",
                    "Avoiding questions"
                ],
                "answer": 1,
                "explanation": "Self-testing helps you check your understanding."
            },
            {
                "question": "What should you do when you make a mistake?",
                "options": [
                    "Review the explanation",
                    "Give up",
                    "Hide the mistake",
                    "Skip all revision"
                ],
                "answer": 0,
                "explanation": "Reviewing mistakes can help you learn."
            },
            {
                "question": "What makes a good explanation?",
                "options": [
                    "Clear examples",
                    "Unrelated words",
                    "No details",
                    "Confusing language"
                ],
                "answer": 0,
                "explanation": "Clear examples help explain ideas."
            },
            {
                "question": "What is a useful revision habit?",
                "options": [
                    "Short practice sessions",
                    "Never reviewing",
                    "Guessing everything",
                    "Ignoring feedback"
                ],
                "answer": 0,
                "explanation": "Regular practice can support learning."
            }
        ]
    }


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/learn", methods=["POST"])
def learn():
    data = request.get_json(silent=True) or {}

    subject = str(data.get("subject", "")).strip()
    topic = str(data.get("topic", "")).strip()

    if not subject or not topic:
        return jsonify({
            "error": "Please enter a subject and topic."
        }), 400

    if len(topic) > 200:
        return jsonify({
            "error": "Please keep the topic under 200 characters."
        }), 400

    # The fallback allows the frontend to be demonstrated
    # even if an API key is not available.
    if not client:
        return jsonify({
            "data": fallback_session(subject, topic),
            "demo": True
        })

    try:
        response = client.responses.create(
            model=MODEL,
            input=create_learning_prompt(subject, topic),
            text={
                "format": {
                    "type": "json_object"
                }
            }
        )

        result = json.loads(response.output_text)

        if len(result.get("questions", [])) != 5:
            raise ValueError("AI returned an invalid quiz.")

        return jsonify({
            "data": result,
            "demo": False
        })

    except Exception as error:
        print("AI error:", error)

        # Keep the app usable during the hackathon.
        return jsonify({
            "data": fallback_session(subject, topic),
            "demo": True,
            "warning": "AI unavailable. Showing demo content."
        })


if __name__ == "__main__":
    app.run(debug=True, port=5000)