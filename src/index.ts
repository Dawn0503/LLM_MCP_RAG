import MCPClient from "./MCPClient";
import Agent from "./Agent";
import path from "path";
import EmbeddingRetriever from "./EmbeddingRetrivers";
import fs from "fs";
import { logTitle } from "./util";

const outPath = path.join(process.cwd(), 'output');
const TASK = `.....`

const fetchMCP = new MCPClient("mcp-server-fetch", "uvx", ['mcp-server-fetch']);
const fileMCP = new MCPClient("mcp-server-file", "npx", ['-y', '@modelcontextprotocol/server-filesystem', outPath]);

async function main() {
    // RAG
    const context = await retrieveContext();

    // Agent
    const agent = new Agent('openai/gpt-4o-mini', [fetchMCP, fileMCP], '', context);
    await agent.init();
    await agent.invoke(TASK);
    await agent.close();
}

main()

async function retrieveContext() {
    // RAG
    const embeddingRetriever = new EmbeddingRetriever("BAAI/bge-m3");
    const knowledgeDir = path.join(process.cwd(), 'knowledge');
    const files = fs.readdirSync(knowledgeDir);
    for await (const file of files) {
        const content = fs.readFileSync(path.join(knowledgeDir, file), 'utf-8');
        await embeddingRetriever.embedDocument(content);
    }
    const context = (await embeddingRetriever.retrieve(TASK, 3)).join('\n');
    logTitle('CONTEXT');
    console.log(context);
    return context
}