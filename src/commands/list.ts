import path from 'path';
import { scan } from '../fileMethods/scan';

export async function listFiles(filePath: string, filterOptions: string, recursive: boolean) {
    const scanResult = await scan(filePath, filterOptions, recursive);
    console.log(scanResult.join('\n'));
    process.exit(0)
}
