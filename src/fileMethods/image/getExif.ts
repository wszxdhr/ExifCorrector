import { exiftool } from 'exiftool-vendored'

/**
 * 获取图片的exif信息
 * @param filePath 图片文件路径
 * @returns exif信息对象
 */
export async function getExif(filePath: string) {
    return exiftool.read(filePath)
}

export async function setExif(filePath: string, exif: Object) {
    return exiftool.write(filePath, exif, {
        writeArgs: ['-overwrite_original']
    })
}
