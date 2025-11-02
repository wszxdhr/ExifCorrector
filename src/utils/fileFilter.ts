import path from 'path';
import fs from 'fs';
import { Tags, exiftool } from 'exiftool-vendored';
import memoizee from 'memoizee';
import { t } from '../i18n/config';
import { devInfo } from './devLog';
import chalk from 'chalk';

// 限制一下缓存个数，避免内存占用过高
const getExifFromCache = memoizee((filePath: string) => {
    return exiftool.read(filePath);
}, { max: 100 });

export class FileFilter {
    private filters: { key: string, value: (filePath: string) => (boolean | Promise<boolean>) }[] = []
    // filterString格式："ext=jpg,mp4 file.name=DJI file.size<100MB file.size>=10MB"
    constructor(private filterString: string) {
        if (!filterString) {
            this.filters = [];
            return;
        }
        this.setFilters(filterString);
        devInfo('\n')
        devInfo(chalk.blue.bgGray('使用筛选：', filterString, '，筛选器数量：', this.filters.length));
    }
    private regexpFilter(value: string) {
        return new RegExp(value).test.bind(new RegExp(value));
    }
    private splitFilters(filterString: string) {
        const filters: { key: string, operator: string, value: string }[] = [];
        let tempKey = '';
        let tempOperator = '';
        let tempValue = '';
        let tempQuote = false;
        let tempDoubleQuote = false;
        for (const index in filterString.split('')) {
            const char = filterString[index];
            // 先检测单引号双引号
            if (char === '"') {
                tempDoubleQuote = !tempDoubleQuote;
                continue;
            }
            if (char === '\'') {
                tempQuote = !tempQuote;
                continue;
            }
            // 检查空格分隔
            if (!tempQuote && !tempDoubleQuote && char === ' ') {
                filters.push({ key: tempKey, operator: tempOperator, value: tempValue });
                tempKey = '';
                tempOperator = '';
                tempValue = '';
                continue;
            }
            // 检查操作符
            if (!tempQuote && !tempDoubleQuote && !tempValue && (char === ':' || char === '=' || char === '>' || char === '<' || char === '!')) {
                tempOperator += char
                continue;
            }
            // 检查key和value
            if (!tempQuote && !tempDoubleQuote && tempOperator) {
                tempValue += char;
                continue;
            } else if (!tempQuote && !tempDoubleQuote) {
                tempKey += char;
                continue
            }
        }
        // 最后一个filter
        filters.push({ key: tempKey, operator: tempOperator, value: tempValue });
        return filters
    }
    private setFilters(filterString: string) {
        this.filters = this.splitFilters(filterString).map(filter => {
            const { key, operator, value } = filter
            switch (true) {
                case key === 'ext':
                    return { key, value: this.getExtFilter(value) };
                case key === 'file.size':
                    return { key, value: (filePath: string) => this.getFileSizeFilter(filePath, value, operator || '=') };
                case key.startsWith('exif.'):
                    return { key, value: (filePath: string) => this.getExifFilter(filePath, key, value, operator || '=') };
                default:
                    console.warn(t('cli.error.unknownFilter', { filter: `${key}${operator}${value}` }));
                    return { key, value: () => true };
            }
        });
    }
    private sizeToBytes(size: string) {
        const number = parseFloat(size.match(/\d+/g)?.[0] || 'NaN');
        if (isNaN(number)) {
            return NaN;
        }
        const unit = size.replace(number + '', '');
        switch (unit) {
            case 'TB':
                return number * 1024 * 1024 * 1024 * 1024;
            case 'GB':
                return number * 1024 * 1024 * 1024;
            case 'B':
                return number;
            case 'MB':
                return number * 1024 * 1024;
            case 'KB':
                return number * 1024;
            default:
                return number;
        }
    }
    private getFileSizeFilter(filePath: string, sizeStr: string, operator: string) {
        const fileSize = fs.statSync(filePath).size;
        const size = this.sizeToBytes(sizeStr);
        if (isNaN(size)) {
            return false;
        }
        switch (operator) {
            case '<':
                return fileSize < size;
            case '>':
                return fileSize > size;
            case '<=':
                return fileSize <= size;
            case '>=':
                return fileSize >= size;
            default:
                return false;
        }
    }
    private getExtFilter(value: string) {
        // 如果是正则
        if (value.startsWith('/') && value.endsWith('/')) {
            return this.regexpFilter(value.substring(1, value.length - 1));
        }
        const extList = value.toLowerCase().split(',');
        // 用path处理出后缀名并去掉.
        return (filePath: string) => {
            const ext = path.extname(filePath).substring(1).toLowerCase();
            return extList.includes(ext);
        };
    }
    private async getExifFilter(filePath: string, key: string, value: string, operator: string) {
        const exif = await getExifFromCache(filePath);
        const tag = key.substring(5) as keyof Tags;
        const exifValue = exif[tag]?.toString() || '';
        switch (operator) {
            case '=':
                return exifValue === value;
            case '!=':
                return exifValue !== value;
            case ':':
                return exifValue.includes(value);
            default:
                return false;
        }
    }
    /**
     * 判断文件路径是否包含过滤字符串
     * @param filePath 文件路径
     * @returns 是否包含过滤字符串
     */
    async match(filePath: string) {
        if (this.filters.length === 0) {
            return true;
        }
        return await Promise.all(this.filters.map(filter => filter.value(filePath))).then(results => results.every(result => result));
    }
}
