/**
 * VectorStoreItem 接口
 * 
 * 定义了向量存储中的每个项目的结构：
 * - embedding: 文档的向量表示，是一个数字数组
 * - document: 原始文档的文本内容
 * 
 * 这种结构允许我们同时存储文档的语义表示(向量)和原始内容
 */
export interface VectorStoreItem {
  embedding: number[], // 文档的向量表示，通常是由嵌入模型生成的高维向量
  document: string     // 原始文档文本，用于在检索后返回给用户
}

/**
 * VectorStore 类
 * 
 * 这个类实现了一个简单的向量存储，用于保存文档的向量表示并支持语义搜索。
 * 向量存储是实现检索增强生成(RAG)系统的核心组件，它允许我们基于语义相似度
 * 而不仅仅是关键词匹配来查找相关文档。
 */
export default class VectorStore {
  /**
   * 存储所有文档及其向量表示的数组
   * 在实际生产环境中，这可能会替换为专门的向量数据库如Pinecone、Milvus等
   */
  private vectorStore: VectorStoreItem[];

  /**
   * 构造函数
   * 初始化一个空的向量存储
   */
  constructor() {
    // 初始化一个空数组来存储文档和它们的向量表示
    this.vectorStore = []
  }

  /**
   * 添加一个新项目到向量存储中
   * 
   * @param item 包含文档和其向量表示的对象
   */
  public addItem(item: VectorStoreItem) {
    // 将新项目添加到存储数组中
    this.vectorStore.push(item)
  }

  /**
   * 在向量存储中搜索与查询向量最相似的文档
   * 
   * 这个方法使用余弦相似度来衡量向量之间的相似程度。
   * 余弦相似度值范围在-1到1之间，值越高表示越相似。
   * 
   * @param queryEmbedding 查询文本的向量表示
   * @param topK 要返回的最相似文档数量，默认为3
   * @returns 返回按相似度降序排列的文档列表，每个文档包含原始文本和相似度分数
   */
  async search(queryEmbedding: number[], topK: number = 3) {
    // 计算查询向量与所有存储文档向量的相似度
    const scored = this.vectorStore.map(item => ({
      document: item.document, // 原始文档文本
      score: this.cosineSimilarity(item.embedding, queryEmbedding) // 计算相似度分数
    }))
    
    // 按相似度分数降序排序，并只返回前topK个结果
    // 降序排序确保最相似的文档排在最前面
    return scored.sort((a, b) => b.score - a.score).slice(0, topK)
  }

  /**
   * 计算两个向量之间的余弦相似度
   * 
   * 余弦相似度是衡量两个向量方向相似性的指标，不考虑它们的大小。
   * 计算公式: cos(θ) = (A·B)/(|A|·|B|)
   * 其中A·B是向量的点积，|A|和|B|是向量的欧几里得范数(长度)
   * 
   * @param a 第一个向量
   * @param b 第二个向量
   * @returns 返回两个向量的余弦相似度，范围在-1到1之间
   */
  private cosineSimilarity(a: number[], b: number[]) {
    // 计算两个向量的点积(dot product)
    // 点积 = a[0]*b[0] + a[1]*b[1] + ... + a[n]*b[n]
    const dotProduct = a.reduce((acc, val, index) => acc + val * b[index], 0)
    
    // 计算向量a的欧几里得范数(长度)
    // |a| = √(a[0]² + a[1]² + ... + a[n]²)
    const magnitudeA = Math.sqrt(a.reduce((acc, val) => acc + val * val, 0))
    
    // 计算向量b的欧几里得范数(长度)
    const magnitudeB = Math.sqrt(b.reduce((acc, val) => acc + val * val, 0))
    
    // 计算余弦相似度: cos(θ) = (A·B)/(|A|·|B|)
    return dotProduct / (magnitudeA * magnitudeB)
  }
}
