import * as fs from 'fs';
import * as path from 'path';

// Helper function to read JSONL files
function readJsonlFile(filePath: string): any[] {
    const data = fs.readFileSync(filePath, 'utf-8');
    return data.split('\n').filter(line => line.trim() !== '').map(line => JSON.parse(line));
}

// Helper function to read JSON files
function readJsonFile(filePath: string): any {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
}

// Helper function to write JSON files
function writeJsonFile(filePath: string, data: any): void {
   fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// Main function to merge JSONL content into JSON files
function mergeJsonlIntoJson(jsonlDir: string, jsonDir: string): void {
    // Read all JSONL files
    const jsonlFiles = fs.readdirSync(jsonlDir).filter(file => file.endsWith('.jsonl'));

    // Read all JSON files
    const jsonFiles = fs.readdirSync(jsonDir).filter(file => file.endsWith('.json'));

    // Create a map from custom_id to content from JSONL files
    const contentMap: { [key: string]: string } = {};

    console.log('开始处理jsoL文件')
    console.time('JSONLTIME')
    jsonlFiles.forEach(file => {
        const filePath = path.join(jsonlDir, file);
        const records = readJsonlFile(filePath);
        
        records.forEach(record => {
           
            const customId = record.custom_id;
            const content =  record.response.body.choices[0].message.content;
           
            contentMap[customId] = content;
        });
    });

    console.timeEnd('JSONLTIME')
    // Merge content into JSON files
    console.log('开始处理json文件')
    console.time('JSONTIME')
    jsonFiles.forEach(file => {
        const filePath = path.join(jsonDir, file);
        try {
            let jsonData = readJsonFile(filePath);
            const customId = jsonData.custom_id;
    
            if (contentMap[customId]) {
                 jsonData.aicontent = contentMap[customId];
                console.log(`Writing to file: ${filePath}`);
                writeJsonFile(filePath, jsonData);
            }
        } catch (error) {
            console.error(`Failed to process file ${filePath}:`, error);
        }
    });
    
    console.timeEnd('JSONTIME')
}

// Specify the directories
const jsonlDirectory = './ai处理结果/nbu.edu.cn'; // Replace with your JSONL directory path
const jsonDirectory = './nbu.edu.cn/info/';   // Replace with your JSON directory path

// Run the merge function
mergeJsonlIntoJson(jsonlDirectory, jsonDirectory);
