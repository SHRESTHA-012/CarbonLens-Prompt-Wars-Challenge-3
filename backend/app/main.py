import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.routes import router
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="CarbonLens API")

# Allow the Vite dev server locally, plus any production origin via env var
allowed_origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
prod_origin = os.environ.get("FRONTEND_ORIGIN")
if prod_origin:
    allowed_origins.append(prod_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

# Attach API endpoints router under /api
app.include_router(router, prefix="/api")

# Define path for static files (production deployment)
base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
dist_path = os.path.join(base_dir, "dist")

if os.path.exists(dist_path):
    # Mount build static assets folder
    assets_path = os.path.join(dist_path, "assets")
    if os.path.exists(assets_path):
        app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

    # Catch-all route to serve the Single Page Application index.html
    @app.get("/{catchall:path}")
    def serve_spa(catchall: str):
        index_file = os.path.join(dist_path, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"message": "FastAPI is running, but SPA index.html is missing."}
else:

    @app.get("/")
    def index():
        return {
            "message": "CarbonLens Backend API is running. Client assets (dist/) not found. Start Vite dev server for frontend."
        }
