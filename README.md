# Academic Application System

## Project Overview

This project is a web application designed to manage academic job applications. It supports various user roles, including:

*   **Aday (Candidate):** Applicants who submit their applications and documents.
*   **Juri (Jury/Reviewer):** Academic staff responsible for evaluating applications.
*   **Yonetici (Manager):** Administrators who oversee the application process.
*   **Admin:** Super administrators with full system access.

The system facilitates the submission, review, and management of academic applications, streamlining the process for all stakeholders.

## Project Structure

The project is organized into two main directories:

*   `api/`: Contains the backend Node.js/Express.js application.
*   `frontend/`: Contains the frontend React application.

## Tech Stack

### Backend (`api/`)

*   **Runtime/Framework:** Node.js, Express.js
*   **Database:** MongoDB (with Mongoose ODM)
*   **Authentication:** JSON Web Tokens (JWT)
*   **File Storage:** Firebase Storage (for application documents, etc.)
*   **PDF Handling:** Libraries for PDF generation and manipulation (pdf-lib, pdfkit)
*   **Other:** Potentially interacts with SOAP web services.

### Frontend (`frontend/`)

*   **Library/Framework:** React (using Vite for building and development)
*   **UI Components:** Chakra UI
*   **Routing:** React Router
*   **State Management:** React Context API (implied by typical React structure, confirm if more specific info is available)
*   **HTTP Client:** Axios

## Backend Setup (`api/`)

To set up and run the backend server:

1.  **Navigate to the API directory:**
    ```bash
    cd api
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure environment variables:**
    *   Create a `.env` file by copying the example:
        ```bash
        cp .env.example .env
        ```
    *   Edit the `.env` file and provide the necessary values for:
        *   `CONNECTION_STRING`: Your MongoDB connection string.
        *   `JWT_SECRET`: A secret key for signing JWTs.
        *   `FIREBASE_SERVICE_ACCOUNT`: The content of your Firebase service account JSON file (or path to it, depending on how `api/app.js` handles it - current `app.js` expects a path `akademik-basvuru-firebase-adminsdk-fbsvc-0379fe325b.json` in the `api` directory).
        *   Other variables as defined in `.env.example`.
    *   **Note on Firebase:** The `api/app.js` currently attempts to load Firebase credentials from a hardcoded path: `akademik-basvuru-firebase-adminsdk-fbsvc-0379fe325b.json` located in the `api/` directory. Ensure this file exists or modify `api/app.js` to load credentials from environment variables if preferred.

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The API should now be running, typically on port 3000 (or as configured). It listens for requests from `http://localhost:5173` (the default frontend address).

## Frontend Setup (`frontend/`)

To set up and run the frontend React application:

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The frontend development server will start, typically on `http://localhost:5173`. The application will connect to the backend API (expected to be running).

## Running the Application

To run the full application:

1.  **Start the backend server:** Follow the steps in the "Backend Setup (`api/`)" section and ensure it's running.
2.  **Start the frontend server:** Follow the steps in the "Frontend Setup (`frontend/`)" section and ensure it's running.

Once both servers are running, you can access the application in your web browser, typically at `http://localhost:5173`.

## Available Scripts

### Backend (`api/`)

*   `npm start`: Starts the application in production mode.
*   `npm run dev`: Starts the application in development mode with file watching (using `nodemon` via `cross-env` and `node --watch`).

### Frontend (`frontend/`)

*   `npm run dev`: Starts the Vite development server.
*   `npm run build`: Builds the application for production.
*   `npm run lint`: Lints the codebase using ESLint.
*   `npm run preview`: Serves the production build locally for preview.
