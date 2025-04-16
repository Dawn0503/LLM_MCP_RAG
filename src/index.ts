import Agent from "./Agent";
import ChatOpenAI from "./ChatOpenAI";
import MCPClient from "./MCPClient";

const currentDir = process.cwd()

const fetchMcp = new MCPClient('fetch', 'uvx', ['mcp-server-fetch'])
const fileMCP = new MCPClient('file', 'npx', ["-y", "@modelcontextprotocol/server-filesystem", currentDir])

async function main() {
  const agent = new Agent('openai/gpt-4o-mini', [fetchMcp, fileMCP])
  await agent.init()
  const response = await agent.invoke(`爬取https://news.ycombinator.com/网站的内容，并且保存在${currentDir}/news.md 文件中`)
  console.log(response)
}


main()