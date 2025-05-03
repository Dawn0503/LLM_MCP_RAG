import ChatOpenAI from "./ChatOpenAI";
import MCPClient from "./MCPClient";
import { logTitle } from "./util";

/**
 * Agent 类
 * 
 * 这个类是整个系统的核心，负责协调大语言模型(LLM)和工具(Tools)之间的交互。
 * Agent可以接收用户输入，调用LLM生成回复，并在需要时执行工具调用，
 * 实现了一个完整的智能助手系统。
 */
export default class Agent {
  // 存储所有MCP客户端的数组，每个客户端可以提供多个工具
  private mcpClients: MCPClient[];
  // 大语言模型实例，用于生成回复和决定何时调用工具
  private llm: ChatOpenAI | null = null;
  // 使用的模型名称，如'gpt-4'
  private model: string
  // 系统提示，用于设置LLM的行为和角色
  private systemPrompt: string
  // 初始上下文信息，为LLM提供背景知识
  private context: string

  /**
   * 构造函数
   * 
   * @param model 要使用的LLM模型名称
   * @param mcpClients MCP客户端数组，每个客户端提供不同的工具功能
   * @param systemPrompt 系统提示，设置LLM的行为模式
   * @param context 初始上下文，提供背景信息
   */
  constructor(model: string, mcpClients: MCPClient[], systemPrompt: string = "", context: string = "") {
    this.mcpClients = mcpClients
    this.model = model
    this.systemPrompt = systemPrompt
    this.context = context
  }

  /**
   * 初始化Agent
   * 
   * 这个方法初始化所有MCP客户端，收集它们提供的工具，
   * 然后创建LLM实例并将工具信息传递给它。
   */
  public async init() {
    logTitle('初始化LLM 和 TOOLS')
    // 初始化所有MCP客户端
    for (const mcpClient of this.mcpClients) {
      await mcpClient.init()
    }
    // 收集所有客户端提供的工具
    const tools = this.mcpClients.flatMap(mcp => mcp.getTools())
    // 创建LLM实例，并传入工具信息
    this.llm = new ChatOpenAI(this.model, this.systemPrompt, tools, this.context)
  }

  /**
   * 关闭所有MCP客户端连接
   * 
   * 在对话结束时调用，确保资源被正确释放
   */
  public async close() {
    logTitle('关闭MCP Client')
    for await (const client of this.mcpClients) {
      await client.close()
    }
  }

  /**
   * 处理用户输入并生成回复
   * 
   * 这个方法是Agent的核心功能，它接收用户输入，将其传递给LLM，
   * 然后处理LLM的回复。如果LLM决定调用工具，Agent会执行工具调用
   * 并将结果返回给LLM，形成一个反馈循环，直到生成最终回复。
   * 
   * @param prompt 用户输入的文本
   * @returns 最终生成的回复内容
   */
  async invoke(prompt: string) {
    if (!this.llm) throw new Error('LLM 未初始化')
    // 将用户输入发送给LLM并获取初始回复
    let response = await this.llm.chat(prompt)
    // 无限循环，agent 可能会和LLM展开很多轮的对话
    while (true) {
      // 检查LLM是否请求调用工具
      if (response.toolCalls.length > 0) {
        // 处理每个工具调用请求
        for (const toolCall of response.toolCalls) {
          // 查找能够处理该工具的MCP客户端
          const mcp = this.mcpClients.find(mcpClient => mcpClient.getTools().find(tool => tool.name === toolCall.function.name))
          if (mcp) {
            // 记录工具调用信息
            logTitle(`TOOL USE` + toolCall.function.name)
            console.log(`Calling tool:${toolCall.function.name}`)
            console.log(`Arguments: ${toolCall.function.arguments}`);
            // 执行工具调用并获取结果
            const result = await mcp.callTool(toolCall.function.name, JSON.parse(toolCall.function.arguments)) // 入参不能直接给字符串，MCP需要解析JSON对象
            console.log(`Result: ${result}`);
            // 将工具调用结果返回给LLM
            this.llm.appendToolResult(toolCall.id, JSON.stringify(result))
          } else {
            // 如果工具未找到，则将工具调用结果添加到LLM的上下文
            this.llm.appendToolResult(toolCall.id, `工具 ${toolCall.function.name} 未找到`)
          }
        }
        // 获取LLM基于工具调用结果的新回复
        response = await this.llm.chat()
        continue;  // 有工具调用则进入下一轮循环
      }
      // 没有工具调用，表示对话已完成，关闭连接并返回最终回复
      await this.close()
      return response.content
    }
  }
}