# AI PDF Chatbot 🤖📚

This project is a web-based chatbot that can read, summarize, and interact with PDF documents using Cloudflare Workers AI. It processes PDFs in chunks, summarizes them, and can generate quizzes or answer questions about the content.

---

## Features

- Upload and read PDF files in the browser
- Summarize large documents in parallel chunks
- Display progress with a visual progress bar
- Chat interface for follow-up questions or quiz generation
- Cloudflare Worker backend with AI integration

---

## Tech Stack

**Frontend:** HTML, CSS, JavaScript  
**Backend:** Cloudflare Workers (Durable Object)  
**AI Model:** `@cf/meta/llama-3-8b-instruct`  
**PDF Parsing:** `pdfjs-dist`

---

## Setup & Installation

1. Clone the repo:
   ```bash
   git clone https://github.com/<your-username>/<repo-name>.git
   cd <repo-name>
