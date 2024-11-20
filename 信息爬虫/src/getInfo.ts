import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';
import axios from 'axios'; // Make sure to import axios
dotenv.config();

// 获取起始URL和域名
const startUrl = `https://${process.env.domain!}`
const domain = process.env.domain!;

// Define the output directory
const outputDir = path.join('./', `${domain}`);

// Ensure the output directory exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const visitedUrlsFilePath = path.join(outputDir, 'visitedUrls.json');
const downloadLinksFilePath = path.join(outputDir, 'download.json');
const infoDir = path.join(outputDir, 'info');

// Ensure the info directory exists
if (!fs.existsSync(infoDir)) {
    fs.mkdirSync(infoDir, { recursive: true });
}

const visitedUrls = new Set<string>();
const downloadLinks = new Set<string>();
const crawlDelay = 10; // Delay in milliseconds between requests

// Load visited URLs from file
function loadVisitedUrls() {
    if (fs.existsSync(visitedUrlsFilePath)) {
        const data = fs.readFileSync(visitedUrlsFilePath, 'utf8');
        const urls = JSON.parse(data);
        urls.forEach((url: string) => visitedUrls.add(url));
    }
}

// Save visited URLs to file
function saveVisitedUrls() {
    const urls = Array.from(visitedUrls);
    fs.writeFileSync(visitedUrlsFilePath, JSON.stringify(urls, null, 2), 'utf8');
}

// Save download links to file
function saveDownloadLinks() {
    const urls = Array.from(downloadLinks);
    fs.writeFileSync(downloadLinksFilePath, JSON.stringify(urls, null, 2), 'utf8');
}

// Normalize URL by removing duplicate query parameters
function normalizeUrl(url: string): string {
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);
    const uniqueParams = new URLSearchParams();

    // Add each parameter only once
    params.forEach((value, key) => {
        if (!uniqueParams.has(key)) {
            uniqueParams.append(key, value);
        }
    });

    urlObj.search = uniqueParams.toString();
    return urlObj.toString();
}

// Check for nested query parameters
function hasNestedQuery(url: string): boolean {
    const urlObj = new URL(url);
    const params = urlObj.searchParams.toString();
    const decodedParams = decodeURIComponent(params);

    // Check for repetitive patterns in the query string
    const pattern = /(.+?)\1{2,}/;
    return pattern.test(decodedParams);
}

// Generate a random 60-character string
function generateCustomId(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 64; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

async function crawl(url: string, domain: string) {
    const normalizedUrl = normalizeUrl(url);

    if (visitedUrls.has(normalizedUrl) || hasNestedQuery(normalizedUrl)) {
        return;
    }

    visitedUrls.add(normalizedUrl);
    saveVisitedUrls(); // Save the URL immediately after adding it

    try {
        const response = await axios.get(normalizedUrl);

        // Check if the response status is 200
        if (response.status !== 200) {
            console.log(`Skipping ${normalizedUrl} due to status code: ${response.status}`);
            return;
        }

        const html = response.data;
        const $ = cheerio.load(html);

        // Extract page title
        const title = $('title').text().trim().replace(/[\/\\?%*:|"<>]/g, '-');

        // Extract keywords from meta tag
        const keywords = $('meta[name="keywords"]').attr('content') || '';
        const sanitizedKeywords = keywords.replace(/[\/\\?%*:|"<>]/g, '-');

        // Extract text content from the entire body
        const textContent = $('body').text().trim();

        // Create a JSON object with the page data
        const pageData = {
            url: normalizedUrl,
            title: title,
            keyword: keywords,
            content: textContent,
            custom_id: generateCustomId() // Add custom_id here
        };

        // Save the JSON object to a file
        const fileName = sanitizedKeywords ? `${title}-${sanitizedKeywords}.json` : `${title}.json`;
        const filePath = path.join(infoDir, fileName);
        fs.writeFileSync(filePath, JSON.stringify(pageData, null, 2), 'utf8');
        console.log(`已处理连接: ${url}`);

        // Find all links on the page
        const links = $('a[href]').map((_, element) => $(element).attr('href')).get();

        for (const link of links) {
            const absoluteUrl = new URL(link, normalizedUrl).href;

            // Check if the link is a downloadable link
            if (/\.(pdf|docx?|xlsx?|pptx?|zip|rar|tar\.gz|7z)$/i.test(absoluteUrl)) {
                downloadLinks.add(absoluteUrl);
                saveDownloadLinks(); // Save download links immediately after adding
                continue; // Skip visiting downloadable links
            }

            if (absoluteUrl.includes(domain) && !visitedUrls.has(normalizeUrl(absoluteUrl)) && !hasNestedQuery(absoluteUrl)) {
                await new Promise(resolve => setTimeout(resolve, crawlDelay)); // Delay before next request
                await crawl(absoluteUrl, domain);
            }
        }
    } catch (error) {
        console.error(`Failed to crawl ${normalizedUrl}:`, error);
    }
}

async function main() {
    loadVisitedUrls(); // Load visited URLs before starting the crawl

    await crawl(startUrl, domain);
}

main().catch(console.error);


//node --max-old-space-size=4096 your_script.js
