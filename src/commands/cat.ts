import fs from 'fs';
import { scan } from '../fileMethods/scan';
import { getExif } from '../fileMethods/image/getExif';
import { showExif } from '../utils/showExif';
import path from 'path';
import { t } from '../i18n/config';

export async function catFiles(filePath: string, filterOptions: string, recursive: boolean, keys?: string[]) {
    const fileList = await scan(filePath, filterOptions, recursive);
    for (const file of fileList) {
        const exif = await getExif(file);
        console.log(t('cli.cat.fileNameOfExif', { fileName: path.basename(file) }));
        showExif(exif, keys);
    }
    process.exit(0)
}
