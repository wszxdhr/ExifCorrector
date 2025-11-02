// 扫描指定文件夹里面的文件
import * as fs from 'fs';
import * as path from 'path';
import { devError } from '../utils/devLog';
import { FileFilter } from '../utils/fileFilter';

export function scan(p: string, filterOptions?: string | FileFilter, recursive?: boolean, progress?: (filePath: string) => void) {
    if (fs.statSync(p).isFile()) {
        return [p];
    } else if (fs.statSync(p).isDirectory()) {
        return scanFolder(p, filterOptions, recursive, progress);
    } else {
        throw new Error('路径不是文件也不是文件夹');
    }
}

/**
 * 递归扫描指定文件夹里面的文件
 * @param folderPath 文件夹路径
 * @param filterOptions 文件过滤选项
 * @param recursive 是否递归子文件夹
 * @param progress 进度回调函数
 * @returns 文件路径数组
 */
export function scanFolder(folderPath: string, filterOptions?: string | FileFilter, recursive?: boolean, progress?: (filePath: string) => void): Promise<string[]> {
    const filter = filterOptions instanceof FileFilter ? filterOptions : new FileFilter(filterOptions || '');
    return new Promise((resolve, reject) => {
        fs.readdir(folderPath, async (err, files) => {
            if (err) {
                devError(err);
                reject(err);
                return;
            }
            const filePaths: string[] = [];

            // Promise.all会卡
            for (const file of files) {
                const filePath = path.join(folderPath, file)
                if (fs.statSync(filePath).isFile()) {
                    progress?.(filePath);
                    if (!await filter.match(filePath)) {
                        continue
                    }
                    filePaths.push(filePath);
                } else if (fs.statSync(filePath).isDirectory() && recursive) {
                    filePaths.push(...(await scanFolder(filePath, filter, recursive, progress)));
                }
            }

            resolve(filePaths);
        });
    });
}
