from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import models
from database import engine
from routes import router

# Create database tables if they do not exist
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Cricket Tournament API - Python")

# Basic CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the API router
app.include_router(router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    # Running on port 8000 to avoid conflicting with Spring Boot on 8080/10000
    uvicorn.run(app, host="0.0.0.0", port=8000)

