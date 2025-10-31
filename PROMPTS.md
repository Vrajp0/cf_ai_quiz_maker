# PROMPTS.md

This file documents all AI-assisted development prompts that directly contributed to building the **cf_ai_quiz_maker** project.  
Each section includes the developer prompt and a summary of the AI’s response that was used in the final implementation.

---

## Prompt 1: Project Design and Architecture

**Prompt:**
> I want to make an AI quiz maker using Cloudflare Workers AI. It should take in a PDF or text input, summarize the content, and then generate quiz questions based on it. I want to use a Worker for the backend, a simple front-end using HTML and JS, and make it deployable through Cloudflare Pages. How should I structure this?

**AI Response Summary:**
- Suggested a modular structure:
  - `src/index.js` → Worker backend using `env.AI.run()` for Llama 3.3.
  - `pages/` → Frontend folder with `index.html`, `script.js`, and `pdfInput.js`.
  - Optional Durable Object for chat history or state.
- Explained how to use Wrangler for deployment and Cloudflare Pages for hosting.
- Covered handling of CORS, JSON input, and response formatting.
- This design became the foundation of the final folder layout.

---

## Prompt 2: Worker Setup and AI Integration

**Prompt:**
> I need a Cloudflare Worker that receives user input, sends it to Llama 3.3 on Workers AI, and returns a JSON response with the AI output. Can you show me the full code including CORS headers and error handling?

**AI Response Summary:**
- Provided a complete Worker implementation that:
  - Accepts only `POST` requests.
  - Includes CORS headers for all origins and methods.
  - Parses `message` from the request body and validates it.
  - Calls the model using:
    ```js
    const response = await env.AI.run("@cf/meta/llama-3-8b-instruct", { messages, max_output_tokens: 256 });
    ```
  - Returns the AI reply in JSON format.
- This became the core logic of `src/index.js`.

---

## Prompt 3: README setup

**Prompt:**
> Create a template for a README.md file that describes the project, the tech stack, and how to host the code locally.

**AI Response Summary:**
- Created a full README.md template with:
    - Overview and description of cf_ai_quiz_maker.
    - Explain tech stack and technologies involved. 
    - Setup instructions for local and Cloudflare environments.
    - Prerequisites section listing Node.js, Wrangler, and Cloudflare credentials.
