import VectorStore from "./VectorStore"
import 'dotenv/config'
import { logTitle } from "./util"
/**
 * EmbeddingRetriver 类
 * 
 * 这个类负责处理文本嵌入(embeddings)和向量检索操作。
 * 向量数据库是一种特殊的数据库，它存储文本的数值表示(向量)，
 * 并允许我们基于语义相似度进行搜索，而不仅仅是关键词匹配。
 */
export default class EmbeddingRetriver {
  // 使用的嵌入模型名称
  private embeddingModel: string
  // 向量存储实例，用于保存和检索向量
  private vectorStore: VectorStore
  
  /**
   * 构造函数
   * @param embeddingModel 要使用的嵌入模型名称，如'BAAI/bg-m3'
   */
  constructor(embeddingModel:string) {
    this.embeddingModel = embeddingModel
    // 初始化一个新的向量存储实例
    this.vectorStore = new VectorStore()
  }

  /**
   * 将查询文本转换为向量表示
   * 
   * 这个方法只是将文本转换为向量，但不会存储到向量库中
   * 通常用于用户输入的查询文本
   * 
   * @param query 需要转换为向量的查询文本
   * @returns 返回表示查询文本的数值向量
   */
  async embedQuery(query: string) : Promise<number[]> {
    logTitle('EMBEDDING QUERY');
    const embedding = await this.embed(query)
    return embedding
  }

  /**
   * 将文档转换为向量并存储到向量库中
   * 
   * 这个方法不仅将文本转换为向量，还会将文本和对应的向量
   * 一起存储到向量库中，以便后续检索
   * 
   * @param document 需要转换并存储的文档文本
   * @returns 返回表示文档的数值向量
   */
  async embedDocument(document: string) : Promise<number[]> {
    logTitle('EMBEDDING DOCUMENT');
    // 首先将文档转换为向量
    const embedding = await this.embed(document)
    // 然后将文档和向量一起添加到向量存储中
    this.vectorStore.addItem({
      embedding: embedding,  // 文档的向量表示
      document: document     // 原始文档文本
    })
    return embedding
  }

  /**
   * 私有方法：将文本转换为向量
   * 
   * 这个方法调用外部API将文本转换为数值向量
   * 
   * @param document 需要转换为向量的文本
   * @returns 返回表示文本的数值向量
   */
  private async embed(document: string) : Promise<number[]> {
    // 调用嵌入API将文本转换为向量
    const response = await fetch(`${process.env.EMBEDDING_BASE_URL}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.EMBEDDING_KEY}`
      },
      body: JSON.stringify({
        model: this.embeddingModel,  // 使用指定的嵌入模型
        input: document,       // 需要转换的文本
        encoding_format: 'float',

      })
    })

    // 解析API返回的结果
    const data = await response.json()
    console.log(data.data[0].embedding);
    
    // 返回嵌入向量
    return data.data[0].embedding
  }

  /**
   * 根据查询文本检索相关文档
   * 
   * 这个方法首先将查询文本转换为向量，然后在向量库中
   * 搜索与查询向量最相似的文档
   * 
   * @param query 查询文本
   * @param topK 要返回的最相似文档数量，默认为3
   * @returns 返回按相似度排序的文档列表
   */
  async retrieve(query: string, topK: number = 3) {
    // 首先将查询文本转换为向量
    const queryEmbedding = await this.embedQuery(query);
    // 然后在向量库中搜索最相似的文档
    // 相似度基于余弦相似度计算，值越高表示越相似
    return this.vectorStore.search(queryEmbedding, topK);
  }
}