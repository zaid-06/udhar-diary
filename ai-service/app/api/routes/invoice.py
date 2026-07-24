from fastapi import APIRouter, UploadFile, File

from app.services.image_extractor import extract_image_data

router = APIRouter()


@router.post("/extract")
async def extract_invoice(file: UploadFile = File(...)):

    image = await file.read()

    text = await extract_image_data(image)

    return {
        "text": text
    }