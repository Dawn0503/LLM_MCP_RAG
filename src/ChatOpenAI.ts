// 导入OpenAI库，用于与OpenAI API交互
import OpenAI from "openai";
// 导入Tool类型定义，用于定义工具功能
import { Tool } from "@modelcontextProtocol/sdk/types.js";
// 导入dotenv配置，用于加载环境变量
import 'dotenv/config'
// 导入日志工具函数
import { logTitle } from "./util";

/**
 * 定义工具调用的接口结构
 * 当AI模型调用工具时，会返回这种格式的数据
 */
export interface toolCall {
  // 工具调用的唯一标识符
  id: string,
  function: {
    // 被调用的函数名称
    name: string,
    // 函数的参数，以字符串形式传递
    // 流式传输返回的都是字符串，
    arguments: string,
  }
}

/**
 * ChatOpenAI类 - 封装与OpenAI聊天模型的交互
 * 提供简单的接口来进行对话并处理工具调用
 */
export default class ChatOpenAI {
  // OpenAI客户端实例
  private llm: OpenAI;
  // 使用的模型名称
  private model: string;
  // ChatCompletionMessageParam 是 OpenAI SDK 中定义的类型，
  // 用于表示聊天完成请求中的消息参数。
  // 它包含了消息的角色（如system、user、assistant）和内容等信息，
  // 用于构建与AI模型的对话历史。
  private messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];  // 对话历史记录
  // MCP 的 tools 参数，定义模型可以使用的工具
  private tools: Tool[];

  /**
   * 构造函数 - 初始化ChatOpenAI实例
   * @param model 模型名称，如'moonshotai/kimi-vl-a3b-thinking:free'
   * @param systemPrompt 系统提示，用于设置AI的行为和角色
   * @param tools 可用的工具列表
   * @param context 初始上下文信息
   */
  constructor(model: string, systemPrompt: string = '', tools: Tool[] = [], context: string = '') {
    // 创建OpenAI客户端，使用环境变量中的API密钥和基础URL
    this.llm = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPEN_BASE_URL,
    })
    this.model = model
    this.tools = tools
    // 如果提供了系统提示，添加到消息历史中
    // 系统提示(system prompt)用于设置AI助手的行为、角色和限制，是对话的基础设置
    if (systemPrompt) this.messages.push({ role: 'system', content: systemPrompt });
    
    // 如果提供了上下文，添加到消息历史中
    // 上下文作为用户消息添加，为AI提供背景信息，使其能够理解后续对话的环境
    // 这对于需要连续对话或特定场景下的交互非常重要
    if (context) this.messages.push({ role: 'user', content: context });
  }

  /**
   * 发送消息并获取AI回复
   * @param prompt 用户输入的提示
   * @returns 包含AI回复内容和工具调用的对象
   */
  async chat(prompt?: string) {
    // 打印聊天开始的标题
    logTitle('Chatting...')
    // 如果提供了提示，添加到消息历史中
    if (prompt) this.messages.push({ role: 'user', content: prompt });
    
    // 创建流式聊天完成请求
    const stream = await this.llm.chat.completions.create({
      model: this.model,
      messages: this.messages,
      stream: true, // 启用流式传输，可以逐步获取回复
      tools: this.getToolsDefinition(), // 提供工具定义
    })
    
    // 用于累积完整回复内容
    let content = ''
    // 用于收集工具调用
    let toolCalls: toolCall[] = []
    // 打印响应标题
    logTitle('RESPONSE')
    
    // 处理流式响应的每个数据块
    for await (const chunk of stream) {
      // delta 是流式响应中当前数据块的差异部分
      // 包含了当前块的文本内容或工具调用信息
      // 在流式响应中，OpenAI API 会将完整回复分成多个小块发送
      // 每个 chunk 的 delta 包含了相对于前一个块的新增内容
      const delta = chunk.choices[0].delta
      // 处理文本内容
      if (delta.content) {
        const contentChunk = delta.content || ''
        content += contentChunk
        // 实时输出到控制台
        process.stdout.write(contentChunk)
      }

      // 处理工具调用
      if (delta.tool_calls) {
        for (const toolCallChunk of delta.tool_calls) {
          // 第一次收到 toolCall，新的 index = 0 
          if (toolCalls.length <= toolCallChunk.index) {
            // 初始化新的工具调用对象
            toolCalls.push({ id: '', function: { name: '', arguments: '' } })
          }
          // 获取当前工具调用对象
          let currentCall = toolCalls[toolCallChunk.index]
          // 累积工具调用ID
          if (toolCallChunk.id) currentCall.id += toolCallChunk.id
          // 累积函数名称
          if (toolCallChunk.function?.name) currentCall.function.name += toolCallChunk.function.name
          // 累积函数参数
          if (toolCallChunk.function?.arguments) currentCall.function.arguments += toolCallChunk.function.arguments
        }
      }
    }
    
    // 将AI回复添加到消息历史中，包括工具调用
    this.messages.push({ role: 'assistant', content, tool_calls: toolCalls.map(call => ({ type: 'function', id: call.id, function: call.function })) })
    // 返回内容和工具调用
    return { content, toolCalls }
  }

  /**
   * 添加工具执行结果到对话历史
   * @param toolCallId 工具调用的ID
   * @param toolOutput 工具执行的输出结果
   */
  public appendToolResult(toolCallId: string, toolOutput: string) {
    // 将工具结果添加到消息历史中
    this.messages.push({ role: 'tool', content: toolOutput, tool_call_id: toolCallId })
  }

  /**
   * 获取工具定义，转换为OpenAI API所需的格式
   * @returns 格式化的工具定义数组
   */
  private getToolsDefinition() {
    // 将工具数组转换为OpenAI API所需的格式
    return this.tools.map(tool => ({
      type: 'function' as const,
      function: tool,
    }))
  }
}




