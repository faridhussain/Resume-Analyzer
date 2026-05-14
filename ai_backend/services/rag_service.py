from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
import requests
from pydantic import BaseModel
import os
from fastapi import APIRouter

router = APIRouter()

from dotenv import load_dotenv

load_dotenv()


class PdfData(BaseModel):
    pdf_url: str


async def rag_service(req: PdfData):
    pdfUrl = req.pdf_url
    print("url :", pdfUrl)
    loader = PyPDFLoader(pdfUrl)
    data = loader.load()
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=100, chunk_overlap=0)
    texts = text_splitter.split_text(data)
    