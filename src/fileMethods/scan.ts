// 扫描指定文件夹里面的文件
import * as fs from 'fs';
import * as path from 'path';
import { devError, devInfo, devLog } from '../utils/devLog';

export function scan(p: string) {
    if (fs.statSync(p).isFile()) {
        return [p];
    } else if (fs.statSync(p).isDirectory()) {
        return scanFolder(p);
    } else {
        throw new Error('路径不是文件也不是文件夹');
    }
}

/**
 * 递归扫描指定文件夹里面的文件
 * @param folderPath 文件夹路径
 * @returns 文件路径数组
 */
export function scanFolder(folderPath: string, ext?: string[], recursive?: boolean, progress?: (filePath: string) => void): Promise<string[]> {
    return new Promise((resolve, reject) => {
        fs.readdir(folderPath, async (err, files) => {
            if (err) {
                devLog(err);
                reject(err);
                return;
            }
            const filePaths: string[] = [];
            const lowerExt = ext?.map(e => e.toLowerCase().replace('.', ''));

            // Promise.all会卡
            for (const file of files) {
                const filePath = path.join(folderPath, file)
                const currentExt = path.extname(file).toLowerCase().replace('.', '');
                if (fs.statSync(filePath).isFile()) {
                    progress?.(filePath);
                    if (lowerExt && lowerExt.length > 0 && !lowerExt.find(e => (currentExt === e))) {
                        continue
                    }
                    filePaths.push(filePath);
                } else if (fs.statSync(filePath).isDirectory() && recursive) {
                    filePaths.push(...(await scanFolder(filePath, ext, recursive, progress)));
                }
            }

            resolve(filePaths);
        });
    });
}
