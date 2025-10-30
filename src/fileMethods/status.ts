// 给定文件路径，输出文件信息
import * as fs from 'fs';
import * as path from 'path';

/**
 * 给定文件路径，输出文件信息
 * @param filePath 文件路径
 * @returns 文件信息对象
 */
export function getFileStatus(filePath: string): fs.Stats {
    const stats = fs.statSync(filePath);
    console.log(`File: ${path.basename(filePath)}`);
    console.log(`Path: ${filePath}`);
    console.log(`Size: ${stats.size} bytes`);
    console.log(`Modified: ${stats.mtime}`);
    return stats;
}
