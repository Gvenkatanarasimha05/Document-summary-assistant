# 📄 Document Summary Assistant


**Live Demo:** [https://document-summary-assistant-production.up.railway.app/](https://document-summary-assistant-production.up.railway.app/)  
**Source Code:** [GitHub Repository](https://github.com/Gvenkatanarasimha05/Document-summary-assistant)

---

## About

Document Summary Assistant is a web application that allows users to upload PDFs or images and generate concise AI summaries. Users can choose the summary length — **short, medium, or long**. The app leverages **Google Gemini API** for summarization and handles both text and OCR from images efficiently.

---

## 🛠 Features

- Upload **PDFs or images** (OCR included)  
- Select **summary length** (short, medium, long)  
- **AI-generated summaries** using Google Gemini API  
- Handles **large documents** with chunk-based summarization  
- Clean and responsive **React frontend**  
- Backend hosted on **Railway**, frontend on **Vercel**

---

##  Tech Stack

**Frontend:** React, Axios  
**Backend:** Node.js, Express.js, Multer, pdf-parse-fixed, Tesseract.js  
**AI Service:** Google Gemini API  
**Deployment:**  Vercel

---

## How It Works

1. **Upload** a PDF or image document.  
2. **Extract** text from PDFs using `pdf-parse` or images using `Tesseract.js`.  
3. **Split** text into manageable chunks.  
4. **Send** each chunk to Google Gemini API for summarization.  
5. **Combine** all chunk summaries into a final summary.  
6. **Display** the summary in the frontend.

---

## Local Setup

1. Clone the repo:

```bash
git clone https://github.com/Gvenkatanarasimha05/Document-summary-assistant.git
cd Document-summary-assistant
