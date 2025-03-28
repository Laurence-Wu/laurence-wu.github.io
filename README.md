# Personal Website Project

This repository contains the source code for a personal website project. It is a full-stack application with a **frontend** built using React and a **backend** built using Python (Flask). The project also includes various assets and utilities for functionality and styling.

## Table of Contents

- [Personal Website Project](#personal-website-project)
  - [Table of Contents](#table-of-contents)
  - [Project Structure](#project-structure)
    - [Backend](#backend)
    - [Frontend](#frontend)
    - [Assets](#assets)
  - [Features](#features)
  - [Setup Instructions](#setup-instructions)
    - [Prerequisites](#prerequisites)
    - [Backend Setup](#backend-setup)
    - [Frontend Setup](#frontend-setup)
  - [Usage](#usage)
  - [Contributing](#contributing)

---

## Project Structure

### Backend
- **`backend/`**: Contains the Python Flask backend.
  - **`app.py`**: Main entry point for the Flask application.
  - **`config.py`**: Configuration settings for the backend.
  - **`routes.py`**: Defines API routes.
  - **`blogProcessing/`**: Handles DOCX file processing.
  - **`OveralTablesOperation/`**: Manages table operations and includes images for reference.
  - **`requirements.txt`**: Lists Python dependencies.

### Frontend
- **`frontend/`**: Contains the React frontend.
  - **`src/`**: Source code for the React application.
    - **`components/`**: Reusable React components.
    - **`styles/`**: CSS files for styling.
    - **`utils/`**: Utility functions for various features.
  - **`public/`**: Static assets like `index.html` and images.

### Assets
- **`backend/Assets/`**: Includes DOCX files for processing.
- **`frontend/src/assets/`**: Contains images, PDFs, and global CSS.

---

## Features

- **Frontend**:
  - Responsive design with React components.
  - Dynamic blog listing and post pages.
  - Navigation bar and additional information sections.
- **Backend**:
  - API endpoints for handling blog processing and table operations.
  - DOCX file extraction and storage.
  - Table creation and deletion utilities.

---

## Setup Instructions

### Prerequisites
- **Node.js** (for the frontend)
- **Python 3.8+** (for the backend)
- **pip** (Python package manager)

### Backend Setup
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file for environment variables (if required).
5. Run the backend server:
   ```bash
   python app.py
   ```

### Frontend Setup
1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```

---

## Usage

1. Start the backend server as described in the [Backend Setup](#backend-setup) section.
2. Start the frontend server as described in the [Frontend Setup](#frontend-setup) section.
3. Open your browser and navigate to `http://localhost:3000` to view the website.

---

## Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Commit your changes and push them to your fork.
4. Submit a pull request.
