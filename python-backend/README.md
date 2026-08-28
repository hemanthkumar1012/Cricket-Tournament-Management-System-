# Python FastAPI Backend

Minimal backend for the Cricket Tournament Management System.
This is an ongoing migration. It currently co-exists with the Spring Boot backend.

## Requirements
- Python 3.9+
- MySQL Server

## Setup and Run
1. Create a virtual environment:
   ```sh
   python -m venv venv
   ```
2. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Mac/Linux: `source venv/bin/activate`
3. Install dependencies:
   ```sh
   pip install -r requirements.txt
   ```
4. Copy `.env.example` to `.env` and set your `DATABASE_URL`.
5. Run the server:
   ```sh
   uvicorn main:app --reload --port 8000
   ```
   Or run the `main.py` directly:
   ```sh
   python main.py
   ```

