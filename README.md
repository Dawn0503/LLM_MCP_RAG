# LLM-MCP-RAG

## 项目概述

这是一个结合了大型语言模型（LLM）、模型上下文协议（MCP）和检索增强生成（RAG）的项目，旨在提供一个高效的知识检索和生成系统。不依赖任何RAG框架，从底层实现各个组件的集成。

## 功能特点

- 使用OpenAI的API进行文本生成
- 整合Model Context Protocol (MCP)提供上下文管理
- 实现向量检索增强生成(RAG)能力

## 安装步骤

1. 克隆仓库

```bash
git clone https://github.com/yourusername/llm-mcp-rag.git
cd llm-mcp-rag
```

2. 安装依赖

```bash
npm install
```

## 环境配置

1. 创建`.env`文件，设置必要的环境变量：

```
OPENAI_API_KEY=your_openai_api_key
EMBEDDING_KEY=your_key
```

## 启动开发服务器

```bash
npm run dev
```

## 项目结构

```
src/
├── index.ts           # 入口文件
├── Agent.ts           # 智能代理实现
├── ChatOpenAI.ts      # OpenAI接口封装
├── MCPClient.ts       # MCP协议客户端
├── EmbeddingRetrivers.ts  # 向量检索实现
├── VectorStore.ts     # 向量存储实现
└── util.ts            # 工具函数
```

## 核心组件说明

- **Agent**: 智能代理，协调LLM、检索系统和MCP客户端
- **ChatOpenAI**: 封装OpenAI的聊天接口
- **MCPClient**: 实现Model Context Protocol客户端功能
- **EmbeddingRetrivers**: 负责文本嵌入和相似度检索
- **VectorStore**: 向量存储的抽象接口和实现

## 示例应用

此项目可用于构建各种基于知识的应用，例如：

- 智能问答系统
- 文档检索助手


## 扩展与定制

您可以通过以下方式扩展项目功能：

1. 添加新的向量存储后端
2. 实现自定义检索策略
3. 集成其他LLM提供商的API
4. 扩展Agent的决策逻辑






