import * as fs from 'fs';
import * as path from 'path';

// Define the data interface
interface JsonData {
    url: string;
    title: string;
    keyword: string;
    content?: string;
    aicontent?: string;
}

// Recursively traverse the directory
function traverseDirectory(dir: string, callback: (filePath: string) => void) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
            traverseDirectory(filePath, callback);
        } else if (path.extname(file) === '.json') {
            callback(filePath);
        }
    });
}

// Process JSON file
function processJsonFile(filePath: string): string {
    const rawData = fs.readFileSync(filePath, 'utf-8').trim();
    if (!rawData) {
        console.warn(`Warning: File ${filePath} is empty.`);
        return '';
    }

    try {
        const jsonData: JsonData = JSON.parse(rawData);
        if (!jsonData.aicontent) {
            console.warn(`Warning: No aicontent found in file ${filePath}.`);
            return '';
        }

        const aiContent = JSON.parse(jsonData.aicontent);
        const mainInfo = aiContent.mainInfo || '';
        if (!mainInfo) {
            console.warn(`Warning: No mainInfo found in aicontent of file ${filePath}.`);
            return '';
        }

        return `## ${jsonData.title}\n\n- **URL**: ${jsonData.url}\n- **Keywords**: ${jsonData.keyword}\n\n${mainInfo}\n\n/ftc\n\n`;
    } catch (error) {
        console.error(`Error parsing JSON from file ${filePath}:`, error);
        return '';
    }
}

// Main function
function main() {
    const directoryPath = './nbu.edu.cn/info/'; // Specify the directory path
    const baseOutputFilePath = './宁波大学知识库';
    const maxFileSize = 49 * 1024 * 1024; // 49MB

    let fileIndex = 1;
    let currentFilePath = `${baseOutputFilePath}_${fileIndex}.md`;
    let currentFileSize = 0;
    let markdownContent = '';

    traverseDirectory(directoryPath, (filePath) => {
        const fileContent = processJsonFile(filePath);
        if (fileContent) {
            // Check if adding new content will exceed the file size limit
            if (currentFileSize + Buffer.byteLength(fileContent, 'utf-8') > maxFileSize) {
                // Write to the current file and reset content
                fs.writeFileSync(currentFilePath, markdownContent, 'utf-8');
                console.log(`Data has been written to ${currentFilePath}`);

                // Prepare for the next file
                fileIndex++;
                currentFilePath = `${baseOutputFilePath}_${fileIndex}.md`;
                markdownContent = '';
                currentFileSize = 0;
            }

            // Add content to the current file
            markdownContent += fileContent;
            currentFileSize += Buffer.byteLength(fileContent, 'utf-8');
        }
    });

    // Write the last file
    if (markdownContent) {
        fs.writeFileSync(currentFilePath, markdownContent, 'utf-8');
        console.log(`Data has been written to ${currentFilePath}`);
    }
}

main();
