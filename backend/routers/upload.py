from fastapi import APIRouter
from fastapi import UploadFile
from fastapi import File
from fastapi import HTTPException
import os
import shutil
router = APIRouter(
    tags=["Upload"]
)
UPLOAD_FOLDER = "uploads"

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Upload ảnh
@router.post("/image")
async def upload_image(
    image: UploadFile = File(...)
):
    if not image.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Chỉ được upload file ảnh"
        )
    file_path = f"{UPLOAD_FOLDER}/{image.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(
            image.file,
            buffer
        )
    return {
        "filename": image.filename,
        "path": file_path
    }

# Upload file
@router.post("/file")
async def upload_file(
    file: UploadFile = File(...)
):
    file_path = f"{UPLOAD_FOLDER}/{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(
            file.file,
            buffer
        )
    return {
        "filename": file.filename,
        "path": file_path
    }