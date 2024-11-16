
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
// 加载环境变量
dotenv.config();
// 定义AI接口地址
const aiurl = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
// 获取API密钥
const apikey = process.env.aiapikey!;

// 定义提示信息
const prompt = '你现在需要提取网页中的信息，只需要原状保留网页中的有用文本信息，无需概况，去掉其他所有无关内容以及页面导航栏，回复格式为{"mainInfo":"有用信息"}}'
// 定义图片信息

// 异步函数，用于获取AI回复
export async function getAi( webInfo: string) {
  // 发送POST请求，获取AI回复
  const response = await fetch(aiurl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `${apikey}`,
    },
    body: JSON.stringify({
      model: 'glm-4-air',
      top_p: 0.7,
      temperature: 0.1,
      stream: false,
      max_tokens:4094,
      messages: [

        {
          "role": "system",
          "content": "你是一个信息提取器"
        },
        {
          "role": "user",
          "content": [
            {
              "type": "text",
              "text": `${prompt}`
            },
            {
              "type": "text",
              "text":`${webInfo}`
            }
          ]
        }
      ]
    })
  })
  // 将响应转换为JSON格式
  const responseJson = await response.json()
  // 打印AI回复的内容


  if (response.status == 200) {

    // 打印AI回复的使用情况


    return responseJson.choices[0].message.content 
  }
   else {
    console.log('AI无法处理')
    console.log(responseJson)
    return  false
    

  }


}



const createBatchFile = async () => {
  const directoryPath = "./dist/info"; // Specify directory path
  const MAX_FILE_SIZE = 99 * 1024 * 1024; // 99MB
  try {
    const files = fs.readdirSync(directoryPath);
    let fileIndex = 0;
    let currentFileSize = 0;
    let outputFilePath = path.join('./', `batch_requests_${fileIndex}.jsonl`);
    let fileStream = fs.createWriteStream(outputFilePath, { flags: 'w' });

    files.forEach(file => {
      const filePath = path.join(directoryPath, file);

      if (path.extname(file) === '.json') {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const jsonData = JSON.parse(fileContent);

        const webInfo = JSON.stringify({ keyWord: jsonData.keyword, body: jsonData.content });
        const customId = jsonData.custom_id;
        const batchData = batchTemple(customId, webInfo);

        const batchDataString = JSON.stringify(batchData) + '\n';
        const batchDataSize = Buffer.byteLength(batchDataString, 'utf-8');

        // Check if adding this data would exceed the max file size
        if (currentFileSize + batchDataSize > MAX_FILE_SIZE) {
          // Close the current file stream
          fileStream.end();
          console.log(`Batch file ${outputFilePath} has been written.`);

          // Increment file index and create a new file
          fileIndex++;
          outputFilePath = path.join('./', `batch_requests_${fileIndex}.jsonl`);
          fileStream = fs.createWriteStream(outputFilePath, { flags: 'w' });
          currentFileSize = 0;
        }

        // Write the data to the current file
        fileStream.write(batchDataString);
        currentFileSize += batchDataSize;
        console.log(`Processed file: ${file}`);
      }
    });

    // Close the last file stream
    fileStream.end();
    console.log(`All batch requests have been written to: batch_requests_*.jsonl`);

  } catch (error) {
    console.error("Error processing files:", error);
  }
};

const batchTemple = (custom_id:string, webInfo:string) => {
  const prompt = '你现在需要提取网页中的信息，只需要原状保留网页中的有用文本信息，无需概况，去掉其他所有无关内容以及页面导航栏，回复格式为{"mainInfo":"有用信息"}}';
  const batchJson = {
      "custom_id": custom_id,
      "method": "POST",
      "url": "/v4/chat/completions",
      "body": {
          model: 'glm-4-flash',
          top_p: 0.7,
          temperature: 0.1,
          stream: false,
          max_tokens: 4094,
          messages: [
              {
                  "role": "system",
                  "content": "你是一个信息提取器"
              },
              {
                  "role": "user",
                  "content": [
                      {
                          "type": "text",
                          "text": `${prompt}`
                      },
                      {
                          "type": "text",
                          "text": `${webInfo}`
                      }
                  ]
              }
          ]
      }
  };

  return batchJson;
};

createBatchFile();