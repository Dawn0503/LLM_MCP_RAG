// 导入必要的模块
import MCPClient from "./MCPClient";  // 导入MCP客户端，用于与模型上下文协议服务器通信
import Agent from "./Agent";  // 导入Agent类，用于创建智能代理
import path from "path";  // 导入path模块，用于处理文件路径
import EmbeddingRetriever from "./EmbeddingRetrivers";  // 导入嵌入检索器，用于RAG（检索增强生成）
import fs from "fs";  // 导入文件系统模块，用于读取文件
import { logTitle } from "./util";  // 导入日志工具函数，用于格式化输出

// 定义常量
const URL = 'https://example.com/'  // 示例URL，可能用于网络请求
const outPath = path.join(process.cwd(), 'output');  // 定义输出路径，用于存储生成的文件
const TASK = `Your Question`  // 定义任务/问题，这是发送给AI的提示

// 初始化MCP客户端
// 创建一个用于网络请求的MCP客户端
const fetchMCP = new MCPClient("mcp-server-fetch", "uvx", ['mcp-server-fetch']);
// 创建一个用于文件操作的MCP客户端，指定输出目录为outPath
const fileMCP = new MCPClient("mcp-server-file", "npx", ['-y', '@modelcontextprotocol/server-filesystem', outPath]);

/**
 * 主函数 - 程序的入口点
 * 执行RAG过程并初始化Agent来处理任务
 */
async function main() {
    // 第一步：执行RAG（检索增强生成）获取相关上下文
    const context = await retrieveContext();

    // 第二步：初始化并使用Agent
    // 创建Agent实例，使用gpt-4o-mini模型，传入MCP客户端和上下文
    const agent = new Agent('openai/gpt-4o-mini', [fetchMCP, fileMCP], '', context);
    await agent.init();  // 初始化Agent，加载工具和模型
    await agent.invoke(TASK);  // 执行任务，将问题发送给Agent处理
    await agent.close();  // 关闭Agent，释放资源
}

// 执行主函数
main()

/**
 * 检索上下文函数 - 实现RAG（检索增强生成）流程
 * 
 * 该函数从知识库中检索与当前任务相关的文档，
 * 并返回最相关的内容作为上下文
 * 
 * @returns {Promise<string>} 返回与任务相关的上下文文本
 */
async function retrieveContext() {
    // 初始化嵌入检索器，使用BAAI/bge-m3模型进行文本嵌入
    const embeddingRetriever = new EmbeddingRetriever("BAAI/bge-m3");
    
    // 获取知识库目录路径
    const knowledgeDir = path.join(process.cwd(), 'knowledge');
    
    // 读取知识库目录中的所有文件
    const files = fs.readdirSync(knowledgeDir);
    
    // 遍历每个文件，读取内容并添加到嵌入检索器中
    for await (const file of files) {
        // 读取文件内容
        const content = fs.readFileSync(path.join(knowledgeDir, file), 'utf-8');
        // 将文件内容转换为嵌入向量并存储
        await embeddingRetriever.embedDocument(content);
    }
    
    // 检索与任务最相关的3个文档，并将它们合并为一个字符串
    const context = (await embeddingRetriever.retrieve(TASK, 3)).join('\n');
    
    // 输出检索到的上下文，便于调试
    logTitle('CONTEXT');
    console.log(context);
    
    // 返回上下文供Agent使用
    return context
}