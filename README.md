# Cricket Tournament Management System

This is a comprehensive management system for cricket tournaments featuring a Spring Boot (Java 21) backend, a React (Vite/Tailwind CSS v4) frontend, and a MySQL database.

## Local Development (Without Docker)
See earlier walkthrough files for direct execution on Windows.

## Production Deployment (With Docker)

### Prerequisites
* Docker and Docker Compose installed on your host server.

### Steps
1. **Clone the repository.**
2. **Configure Environment variables:**
   Copy `.env.example` to `.env` and fill in your secure database password.
   ```sh
   cp .env.example .env
   ```
3. **Start the application stack:**
   ```sh
   docker-compose up -d --build
   ```
4. **Access the application:**
   The frontend will be available at `http://localhost:80` (or your server IP).
   The backend API runs on `http://localhost:8080`.
   Nginx automatically proxies `/api` calls from the frontend to the backend.

### Services
* **db**: MySQL 8.0 container holding `cricket_db`.
* **backend**: Spring Boot application running on port 8080.
* **frontend**: Nginx serving statically built React application on port 80.

