# Placement Bot v2

An AI-powered chatbot platform designed to assist users with placement preparation, including resume analysis, mock interviews, and company insights. Built with a modular backend using Python (Flask), this project provides a web interface for interactive learning and preparation.

## Features

- **Resume Analysis:** Upload and analyze resumes for feedback and improvement suggestions.
- **Mock Interviews:** Simulate interview scenarios and receive AI-generated feedback.
- **Company Insights:** Get detailed information and analytics about companies to prepare for interviews.
- **Interactive Dashboard:** User-friendly web interface for seamless navigation and interaction.

## Project Structure

```
placement-bot-v2/
  backend/
	 app.py                  # Main Flask application
	 requirements.txt        # Python dependencies
	 routes/                 # API route definitions
	 services/               # Business logic and service layer
	 static/                 # Static files (CSS, JS)
	 templates/              # HTML templates
```

## Getting Started

### Prerequisites

- Python 3.12+
- pip (Python package manager)

### Installation

1. Navigate to the backend directory:
	```sh
	cd placement-bot-v2/backend
	```
2. Install dependencies:
	```sh
	pip install -r requirements.txt
	```

### Running the Application

1. Start the Flask server:
	```sh
	python app.py
	```
2. Open your browser and go to `http://localhost:5000` to access the web interface.

## Folder Details

- **routes/**: Contains route handlers for different features (insights, interviews, resume, etc.).
- **services/**: Implements the core logic for resume parsing, interview simulation, and insights.
- **static/**: CSS and JavaScript files for frontend styling and interactivity.
- **templates/**: HTML templates for rendering web pages.

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the MIT License.
