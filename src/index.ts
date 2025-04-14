import ChatOpenAI from "./ChatOpenAI";

async function main() {
  const llm = new ChatOpenAI('moonshotai/kimi-vl-a3b-thinking:free')
  const { content, toolCalls } = await llm.chat('你是什么模型')
  console.log(content)
  console.log(toolCalls)
}

main()