import { scanFolder } from '../fileMethods/scan';

export async function listFiles(filePath: string, filterOptions: string, recursive: boolean) {
    const scanResult = await scanFolder(filePath, filterOptions, recursive);
    console.log(scanResult.join('\n'));
    process.exit(0)
}
