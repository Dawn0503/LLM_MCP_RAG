import ChatOpenAI from "./ChatOpenAI";
import MCPClient from "./MCPClient";
import { logTitle } from "./util";

export default class Agent {
  private mcpClients: MCPClient[];
  private llm: ChatOpenAI | null = null;
  private model: string
  private systemPrompt: string
  private context: string

  constructor(model: string, mcpClients: MCPClient[], systemPrompt: string = "", context: string = "") {
    this.mcpClients = mcpClients
    this.model = model
    this.systemPrompt = systemPrompt
    this.context = context
  }

  public async init() {
    logTitle('初始化LLM 和 TOOLS')
    // this.llm = new ChatOpenAI(this.model, this.systemPrompt)
    for (const mcpClient of this.mcpClients) {
      await mcpClient.init()
    }
    const tools = this.mcpClients.flatMap(mcp => mcp.getTools())
    this.llm = new ChatOpenAI(this.model, this.systemPrompt, tools, this.context)
  }

  public async close() {
    logTitle('关闭MCP Client')
    for await (const client of this.mcpClients) {
      await client.close()
    }
  }

  async invoke(prompt: string) {
    if (!this.llm) throw new Error('LLM 未初始化')
    let response = await this.llm.chat(prompt)
    // 无限循环，agent 可能会和LLM展开很多轮的对话
    while (true) {
      if (response.toolCalls.length > 0) {
        for (const toolCall of response.toolCalls) {
          const mcp = this.mcpClients.find(mcpClient => mcpClient.getTools().find(tool => tool.name === toolCall.function.name))
          if (mcp) {
            logTitle(`TOOL USE` + toolCall.function.name)
            console.log(`Calling tool:${toolCall.function.name}`)
            console.log(`Arguments: ${toolCall.function.arguments}`);
            const result = await mcp.callTool(toolCall.function.name, JSON.parse(toolCall.function.arguments)) // 入参不能直接给字符串，MCP需要解析JSON对象
            console.log(`Result: ${result}`);
            this.llm.appendToolResult(toolCall.id, JSON.stringify(result))
          } else {
            // 如果工具未找到，则将工具调用结果添加到LLM的上下文
            this.llm.appendToolResult(toolCall.id, `工具 ${toolCall.function.name} 未找到`)
          }
        }
        // 下一次对话，
        response = await this.llm.chat()
        continue;  // 有工具调用则进入下一轮循环
      }
      // 没有工具调用，则结束循环
      await this.close()
      return response.content
    }
  }
}