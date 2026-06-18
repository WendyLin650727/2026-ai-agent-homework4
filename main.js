import { input } from "@inquirer/prompts";

//import OpenAI from "openai";
//import { OPENAI_API_KEY } from "./config.js";
//import { initMessage, addMessage, getMessages } from "./db/messages.js";

import { client, DEFAULT_MODEL } from "./lib/openai.js";
import { spinner } from "./utils/spinner.js";
import { toOpenAITool } from "./utils/func-tool.js";
import * as allTools from "./tools/index.js";

//const client = new OpenAI({ apiKey: OPENAI_API_KEY });
const toolList = Object.values(allTools);
const tools = toolList.map(toOpenAITool);
const AVAILABLE_TOOLS = Object.fromEntries(toolList.map((t) => [t.name, t.fn]));

const messages = [];
//現在幾點?
//信義區有YouBike可以借嗎?
//現在幾點?大安區有YouBike可以借嗎?

//await initMessage(
//  "你是一位專門查詢現在時間與YouBike站點的專家，請用繁體中文回答。"
//);

try {
  while (true) {
    const userQuestion = (
      await input({ message: "我是專門查詢現在時間與YouBike站點的專家，請輸入你的問題：" })
    ).trim();

    if (userQuestion === "") continue;
    if (userQuestion.toLowerCase() === "exit") {
      console.log("再會~");
      break;
    }

    //await addMessage(userQuestion);
    messages.push({ role: "user", content: userQuestion });

    const spin = spinner("思考中...").start();

    //const messages = [
    //    {
    //      role: "user",
    //      content: userQuestion,
    //    },
    //];


    const response = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages,
      tools,
      tool_choice: "auto",
    });
  
    spin.stop();
  
    const message = response.choices[0].message;
    messages.push(message);


    if (!message.tool_calls || message.tool_calls.length === 0) {
      console.log(message.content);
      break;
    } 
  
    for (const toolCall of message.tool_calls) {
      const fnName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);
      console.log(`\n[呼叫 tool] ${fnName}(${JSON.stringify(args)})`);
  
      const fn = AVAILABLE_TOOLS[fnName];
      const result = await fn(args);
  
      messages.push({
        
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      });

      console.log(`[回傳結果] ${(result)}\n`);

      //console.log(getMessages());

    }

  }
} catch (err) {
    if (err.name === "ExitPromptError") {
      console.log("\n再會~");
    } else {
      throw err;
    }
}