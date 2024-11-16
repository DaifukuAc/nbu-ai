import * as fs from 'fs';
import * as path from 'path';

// 判断一个字符是否是中文字符
function isChineseCharacter(char: string): boolean {
    const chineseCharRegex = /[\u4e00-\u9fa5]/;
    return chineseCharRegex.test(char);
}

// 计算字符串中的中文字符数量
function countChineseCharacters(text: string): number {
    let count = 0;
    for (const char of text) {
        if (isChineseCharacter(char)) {
            count++;
        }
    }
    return count;
}

// 处理单个JSON文件
function processJsonFile(filePath: string): void {
    const data = fs.readFileSync(filePath, 'utf-8');
    const json = JSON.parse(data);

    if (json.content && typeof json.content === 'string') {
        const chineseCharCount = countChineseCharacters(json.content);
        json.chineseCharacterCount = chineseCharCount;

        fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf-8');
        console.log(`Processed ${filePath}: ${chineseCharCount} Chinese characters found.`);
    } else {
        console.log(`No valid content field found in ${filePath}.`);
    }
}

// 遍历目录中的所有JSON文件
function traverseDirectory(dir: string): void {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            traverseDirectory(fullPath);
        } else if (stat.isFile() && path.extname(fullPath) === '.json') {
            processJsonFile(fullPath);
        }
    }
}

// 指定要遍历的目录
const targetDirectory = './dist/info';
//traverseDirectory(targetDirectory);



function countJsonFilesAndContentLength(dir: string): { totalJsonFiles: number, totalContentLength: number } {
    let jsonFileCount = 0;
    let totalContentLength = 0;

    function traverseDirectory(currentPath: string) {
        const files = fs.readdirSync(currentPath);

        for (const file of files) {
            const fullPath = path.join(currentPath, file);
            const stats = fs.statSync(fullPath);

            if (stats.isDirectory()) {
                // 如果是目录，递归遍历
                traverseDirectory(fullPath);
            } else if (stats.isFile() && path.extname(fullPath) === '.json') {
                // 如果是JSON文件，计数加一
                jsonFileCount++;

                // 读取并解析JSON文件
                const fileContent = fs.readFileSync(fullPath, 'utf-8');
                try {
                    const jsonData = JSON.parse(fileContent);
                    if (typeof jsonData.content === 'string') {
                        totalContentLength += jsonData.content.length;
                    }
                } catch (error) {
                    console.error(`Error parsing JSON file: ${fullPath}`, error);
                }
            }
        }
    }

    traverseDirectory(dir);
    return { totalJsonFiles: jsonFileCount, totalContentLength };
}

// 使用示例

const result = countJsonFilesAndContentLength(targetDirectory);
console.log(`总的 JSON 文件数量: ${result.totalJsonFiles}`);
console.log(`所有 JSON 文件中 content 字段的总字符数: ${result.totalContentLength}`);