// 扫描指定文件夹里面的文件
import * as fs from 'fs';
import * as path from 'path';
import { devError, devInfo, devLog } from '../utils/devLog';
import { FileFilter } from '../utils/fileFilter';
import ora from 'ora';
import { t } from '../i18n/config';

export async function scan(p: string, filterOptions?: string | FileFilter, recursive?: boolean): Promise<string[]> {
    const filter = filterOptions instanceof FileFilter ? filterOptions : new FileFilter(filterOptions || '');
    if (fs.statSync(p).isFile()) {
        return [p];
    } else if (fs.statSync(p).isDirectory()) {
        const spinner = ora(t('cli.info.collectingFiles')).start();
        await new Promise(resolve => setTimeout(resolve, 0))
        const total = fs.readdirSync(p, { recursive, withFileTypes: true });
        spinner.stop();
        const result: string[] = []
        for (const item of total) {
            if (item.isFile() && await filter.match(path.join(item.parentPath, item.name))) {
                result.push(path.join(item.parentPath, item.name));
            }
        }
        devLog('\n')
        devInfo(`Get ${result.length} files from ${total.length} files`);
        return result;
    } else {
        throw new Error('路径不是文件也不是文件夹');
    }
}
