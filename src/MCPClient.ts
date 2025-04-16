import { Client } from '@modelcontextProtocol/sdk/client/index.js'
import { Tool } from '@modelcontextProtocol/sdk/types';
import { StdioClientTransport } from '@modelcontextProtocol/sdk/client/stdio.js';


export default class MCPClient {
  private mcp: Client;
  private transport: StdioClientTransport | null = null;
  private tools: Tool[] = [];
  private command: string;
  private args: string[];
  constructor(name: string, command: string, args: string[], version?: string) {
    this.mcp = new Client({ name, version: version || '1.0.0' })
    this.command = command
    this.args = args
  }

  // 封装关闭连接，防止暴露公共属性
  public async close() {
    await this.mcp.close();
  }
  public async init() {
    await this.connectToServer();
  }
  public getTools() {
    return this.tools;
  }
  public async callTool(name:string, params:Record<string, any>) {
    return await this.mcp.callTool( { name, arguments: params })
  }
  // npx 对应 command 、 @modelcontextprotocol/sdk/client/stdio  arguments

  // 初始化时才调用这个方法
  private async connectToServer() {
    try {
      // command + arguments 更通用，无需将代码拉入本地
      this.transport = new StdioClientTransport({
        command: this.command,
        args: this.args,
      })
      // 连接到服务器
      await this.mcp.connect(this.transport)

      const toolsResult = await this.mcp.listTools();
      this.tools = toolsResult.tools.map((tool) => {
        return {
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        }
      })
      console.log("Connected to server with tools", this.tools.map(({ name }) => name))
    } catch (error) {
      console.error('Failed to connect to MCP server', error)
      throw error;
    }
  }
}