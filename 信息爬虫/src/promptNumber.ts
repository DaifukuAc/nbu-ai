import * as fs from 'fs';
import * as path from 'path';

// 异步读取文件内容并解析为 JSON
async function readJsonlFile(filePath: string): Promise<any[]> {
  const data = await fs.promises.readFile(filePath, 'utf-8');
  return data.split('\n').filter(line => line.trim() !== '').map(line => JSON.parse(line));
}

// 计算指定目录中所有 JSONL 文件的 total_tokens 累加和
async function calculateTotalTokens(directory: string): Promise<number> {
  let totalTokens = 0;

  // 读取目录中的所有文件
  const files = await fs.promises.readdir(directory);

  console.time('forTime')
  for (const file of files) {
    const filePath = path.join(directory, file);

    // 检查文件是否为 JSONL 文件
    if (path.extname(file) === '.jsonl') {
      try {
        const records = await readJsonlFile(filePath);

        
        // 累加每个记录中的 total_tokens
        for (const record of records) {
           
          if (record.response.body.usage.total_tokens) {
            totalTokens += record.response.body.usage.total_tokens;
          }
        }
      } catch (error) {
        console.error(`读取文件出错: ${filePath}`, error);
      }
    }
  }

  console.timeEnd('forTime')
  return totalTokens;
}

// 使用示例
const directoryPath = './ai处理结果/nbu.edu.cn/'; // 替换为你的目录路径
calculateTotalTokens(directoryPath)
  .then(total => {
    console.log(`所有 JSONL 文件的 total_tokens 累加和为: ${total}`);
  })
  .catch(error => {
    console.error('计算 total_tokens 出错:', error);
  });
