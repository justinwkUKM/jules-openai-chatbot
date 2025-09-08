# React and FastAPI LangGraph Agent

This project demonstrates a web-based chat application with a React frontend and a FastAPI backend. The backend uses LangChain and LangGraph to create a simple conversational agent.

## Project Structure

- `react-agent/`: Contains the React frontend application.
- `backend/`: Contains the FastAPI backend server.

## Prerequisites

- Node.js and npm (for the frontend)
- Python 3.8+ and pip (for the backend)
- An OpenAI API key

## Setup and Running the Application

You need to run two separate processes for the frontend and the backend.

### 1. Backend (FastAPI)

First, set up and run the backend server.

**a. Create a `.env` file:**

Navigate to the `backend` directory and create a file named `.env`. Add your OpenAI API key to this file:

```
OPENAI_API_KEY=your_openai_api_key_here
```

**b. Install dependencies:**

From the root directory of the project, run:

```bash
pip install -r backend/requirements.txt
```

**c. Run the server:**

From the root directory, run:

```bash
uvicorn backend.main:app --reload --port 8000
```

The backend server will be running at `http://localhost:8000`.

### 2. Frontend (React)

In a **new terminal window**, set up and run the frontend application.

**a. Navigate to the frontend directory:**

```bash
cd react-agent
```

**b. Install dependencies (if you haven't already):**

```bash
npm install
```

**c. Run the application:**

```bash
npm start
```

The React application will open in your browser at `http://localhost:3000`. You can now interact with the chatbot.
