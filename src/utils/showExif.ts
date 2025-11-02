import { Tags } from 'exiftool-vendored';

export function showExif(exif: Tags, keys?: string[]) {
    for (const key in exif) {
        if (!keys || keys.length === 0 || keys.includes(key)) {
            console.log(`${key}: ${exif[key as keyof Tags]}`);
        }
    }
}
