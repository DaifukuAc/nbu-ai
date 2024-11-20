import * as fs from 'fs';
import * as path from 'path';

// Helper function to read JSON files
function readJsonFile(filePath: string): any {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
}

// Function to check JSON files for 'aicontent'
function checkJsonFiles(jsonDir: string): void {
    // Read all JSON files
    const jsonFiles = fs.readdirSync(jsonDir).filter(file => file.endsWith('.json'));

    let totalFiles = 0;
    let filesWithAicontent = 0;

    jsonFiles.forEach(file => {
        const filePath = path.join(jsonDir, file);
        try {
            const jsonData = readJsonFile(filePath);
            totalFiles++;

            if (jsonData.aicontent) {
                filesWithAicontent++;
            }
        } catch (error) {
            console.error(`Failed to process file ${filePath}:`, error);
        }
    });

    console.log(`Total JSON files: ${totalFiles}`);
    console.log(`JSON files with 'aicontent': ${filesWithAicontent}`);
}

// Specify the directory
const jsonDirectory = './nbu.edu.cn/info/';   // Replace with your JSON directory path

// Run the check function
checkJsonFiles(jsonDirectory);
