// Durable Object class
export class ChatRoom {
    constructor(state, env) {
      this.state = state;
      this.env = env;
    }
  
    async fetch(request) {
      // Handle preflight OPTIONS requests for CORS
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
          }
        });
      }
  
      // Only accept POST
      if (request.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
      }
  
      // Load previous conversation history
      let history = (await this.state.storage.get("history")) || [];
      // let history = [];
      console.log(history.map(obj => obj.content).join(" ").length)
      while(history.map(obj => obj.content).join(" ").length > 7000){
        history.shift();
      }
  
      try {
        const { message, addToHistory, cont } = await request.json();
        if (!message) throw new Error("No message provided");
  
        // Add user message to history
        history.push({ role: "user", content: message });
  
        // Call Workers AI Llama 3.3
        const aiResponse = await this.env.AI.run("@cf/meta/llama-3-8b-instruct", {
          messages: history,
          max_output_tokens: 256
        });
        console.log("AI response:", aiResponse);
        console.log("_______________________________________")
        const reply = aiResponse?.response || "Sorry, I couldn't get a response.";
        const usage = aiResponse.usage
        // Save AI reply to history
        
        if(addToHistory == true){
          history.push({ role: "assistant", content: reply });
        }
        else{
          // console.log(history);
          history.pop();
          if (cont == true){
            //console.log(history[0]);
            history.push({role: "assistant" , content: reply});
          }
        }
        
        await this.state.storage.put("history", history);
  
        // Return JSON response with CORS headers
        return new Response(JSON.stringify({ reply, usage }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
          }
        });
  
      } catch (err) {
        console.error("AI call failed:", err);
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
          }
        });
      }
    }
  }
  
  // Main Worker that forwards requests to the Durable Object
  export default {
    async fetch(request, env) {
      // Get the Durable Object instance (one global chat room)
      const id = env.CHAT_ROOM.idFromName("global");
      const room = env.CHAT_ROOM.get(id);
  
      return room.fetch(request);
    }
  };
  
