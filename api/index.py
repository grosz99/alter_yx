from fastapi import FastAPI

app = FastAPI()

@app.get("/api/health")
async def health():
    return {"status": "healthy", "service": "Alter-YX API"}

@app.get("/")
async def root():
    return {"message": "API is running"}
