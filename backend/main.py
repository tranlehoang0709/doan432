from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from routers.auth import router as auth_router
from routers.message import router as message_router
from routers.friend import router as friend_router
from routers.upload import router as upload_router
from database import Base, engine
from routers.conversation import router as conversation_router
from realtime.server import start_server
from fastapi.middleware.cors import CORSMiddleware
from routers import search
from models.user import User
from models.friendship import Friendship
from models.conversation import Conversation
from models.message import Message
from models.attachment import Attachment

Base.metadata.create_all(bind=engine)
from database import migrate_db
migrate_db()
app = FastAPI()
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex="https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    auth_router,
    prefix="/auth",
    tags=["Auth"]
)
app.include_router(
    message_router,
    prefix="/message",
    tags=["Message"]
)
app.include_router(
    friend_router,
    prefix="/friend",
    tags=["Friend"]
)
app.include_router(
    conversation_router,
    prefix="/conversation",
    tags=["Conversation"]
)
app.include_router(
    upload_router,
    prefix="/upload",
    tags=["Upload"]
)
app.include_router(
    search.router,
    prefix="/search",
    tags=["Search"]
)
@app.get("/")
def home():
    return {
        "project": "Mess"
    }
