import { extractTextFromPDF } from "./pdfInput.js";

const chatBox = document.getElementById("chat");
const inputField = document.getElementById("user-input");
const pdfInput = document.getElementById("pdfInput");

async function sendMessage() {
  const text = inputField.value.trim();
  if (!text) return;

  addMessage(text, "user");
  inputField.value = "";

  try {
      console.log(text);
      const data = await callBot(text);
      addMessage(data.reply, "assistant"); // show AI response
    } catch (err) {
      addMessage("Error: " + err.message, "assistant");
    }
  }

function addMessage(text, sender) {
  const div = document.createElement("div");
  div.className = `message ${sender}`;
  div.innerText = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function callBot(textPrompt, additionalPrompt="", addToHistory=false, cont=false){
  let chatbotInput = textPrompt
  if (additionalPrompt != ""){
    chatbotInput = `${additionalPrompt}:\n ${textPrompt}`;
  }

  if (chatbotInput.length > 10000){
    console.log(`${chatbotInput.length}: cannot be over 10000`);
    throw new Error("context window");
  }
  console.log(chatbotInput);
  const response = await fetch(
    "https://cf-chatbot.mvp3350.workers.dev/", 
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: chatbotInput, addToHistory: addToHistory, cont:cont}),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText);
      }
  
      const botOutput = await response.json();
      return botOutput;
}

pdfInput.addEventListener("change", async (e) => {
  
  const file = e.target.files[0];
  if (!file) return;

  addMessage(`Uploading PDF: ${file.name}`, "user");
  const text = await extractTextFromPDF(file);

  const chunks = chunkText(text, 3000);
  addMessage(`Splitting into ${chunks.length} sections...`, "user");

  let summaryPrompt = "Summarize this section in less than 50 words with a focus on main ideas, and key vocab while simplifying the text to only the essentials. Do not state that you are providing a summary, just provide a summary";
  let summaries = await parallelSummarize(chunks, 3, summaryPrompt); // 3 concurrent
  addMessage("Merging all summaries into one final summary...", "user");

  let completeStudyGuide = await mergeSummaries(summaries);
  //conssole log the complete study guide to see whats happening
  addMessage(completeStudyGuide, "assistant");


  let quiz = await createQuiz();

  addMessage(quiz, "QUIZ");
  console.log(quiz);
});


document.getElementById("sendButton").addEventListener("click", sendMessage);

function chunkText(text, maxLength = 1000) {
  const words = text.split(/\s+/);
  const chunks = [];
  let current = [];

  for (const word of words) {
    current.push(word);
    if (current.join(" ").length > maxLength) {
      chunks.push(current.join(" "));
      current = [];
    }
  }

  if (current.length > 0) chunks.push(current.join(" "));
  return chunks;
}


async function parallelSummarize(chunks, concurrency = 3, prompt) {

  const progressContainer = document.getElementById("progress-container");
  const progressBar = document.getElementById("progress-bar");
  const progressText = document.getElementById("progress-text");

  progressContainer.style.display = "block";
  progressText.style.display = "block";
  progressBar.style.width = "0%";

  const summaries = [];
  let index = 0;

  async function worker() {
    while (index < chunks.length) {
      const i = index++;
      const chunk = chunks[i];

      const progressPercent = Math.round(((i + 1) / chunks.length) * 100);
      progressBar.style.width = `${progressPercent}%`;
      progressText.innerText = `Processing batch ${i + 1} of ${chunks.length} (${progressPercent}%)`;

      try {
        // console.log(`Chunk ${i}:\n ${chunk}`);
        const response = await callBot(chunk, prompt);
        // console.log(`Response ${i}:\n ${response.reply}`);
        summaries[i] = response.reply;
        console.log(`Finished chunk ${i + 1}/${chunks.length}`);
      } catch (err) {
        console.error(`Error summarizing chunk ${i + 1}:`, err);
        summaries[i] = "(Error summarizing this section)";
      }
    }
  }

  const workers = Array.from({ length: concurrency }, worker);
  await Promise.all(workers);
  return summaries;
}

async function mergeSummaries(summaries){
  const progressText = document.getElementById("progress-text");

  let finalSummary = summaries.join("\n\n");
  console.log(finalSummary);

  let botOutput = "";
  let responseTokens = "256";
  let finalPrompt = "Merge all these summaries into a single response that summarizes the main points of each summary. Use bullets to compare points where necessary. Make note of any examples provided by the text.Keep it 150 words max."
  let continuePrompt = "That was not the whole thing, start right where you left off and dont give an intro sentence. youve already given 150 words. finish the rest of the summsry in no more than 50 words."

  while (true){
    if (finalSummary.length < 5000){
      progressText.innerText = `Creating Final Summary (Takes around 30 sec)`;
      let response = await callBot(finalSummary, finalPrompt, true, false);
      botOutput = response.reply;
      
      responseTokens = response.usage["completion_tokens"];

      while (responseTokens == 256){
        let response = await callBot(continuePrompt, "", false, true);
        botOutput = botOutput + " " + response.reply;
        console.log(botOutput);
        responseTokens = response.usage["completion_tokens"];
      }
      
      return botOutput;

    } else {
        console.warn("Summary too large! Retrying with smaller chunks...");
        summaries = chunkText(finalSummary, 2000)
        summaries =  await parallelSummarize(summaries,3,"Summarize this section in less than 50 words with a focus on main ideas, and key vocab while simplifying the text to only the essentials. Start right with the summary. Do not state that you are providing a summary");
        finalSummary = summaries.join("\n\n")
      }
    }
  }

async function createQuiz(){
  const progressContainer = document.getElementById("progress-container");
  const progressBar = document.getElementById("progress-bar");
  const progressText = document.getElementById("progress-text");

  progressContainer.style.display = "block";
  progressText.style.display = "block";
  progressBar.style.width = "0%";


  progressText.innerText = `Creating Quiz (Takes around 30 sec)`;
  progressBar.style.width = `${50}%`;
  let quizPrompt = "Use these summaries to create 2 multiple choice questions. For each question separate the question, different options, and explaination with a '-' (refrain from using '-' in the quesion, options, or explanaiton). The following is a rough format you should adhere to: Question X: (state question)?- A. (option A)- B. (option B)- C. (option C)- D. (option D)- An explaination for the correct answer and why the other answers are incorrect. "
  const quizzes = await callBot(quizPrompt, "");

  progressBar.style.width = `${100}%`;
  let quizPrompt2 = `Create 1 more multiple choice quesion that matches the format of the questions provided after this and one short answer question that is different than the previous questions and provide a short example answer. The following is an example of 2 questions written about the same text, create different questions.`;
  const quizzes2 = await callBot(quizPrompt2, "");


  let fullQuiz = quizzes.reply + "\n" +quizzes2.reply;

  progressText.innerText = `Complete!`;
  progressBar.style.width = "0%";

    setTimeout(() => {
    progressContainer.style.display = "none";
    progressText.style.display = "none";
  }, 1500);
      
  return fullQuiz;

}


