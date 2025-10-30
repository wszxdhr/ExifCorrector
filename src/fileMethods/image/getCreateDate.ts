import moment from 'moment-timezone';
import { getExif } from './getExif';
import { ExifDateTime } from 'exiftool-vendored';

const localTimeZone = moment.tz.guess()
const utcOffset = moment().utcOffset()

export async function getCreateDate(filePath: string) {
    // TODO: 缺一些错误捕获
    const exif = await getExif(filePath);
    const datetime = exif.DateTimeOriginal || exif.CreateDate
    let result: string | undefined = datetime?.toString() + ''
    let tz = localTimeZone
    switch (typeof datetime) {
        case 'string':
            result = datetime
            break
        case 'object':
            result = datetime?.rawValue
            tz = (datetime instanceof ExifDateTime ? datetime.zone : undefined) || localTimeZone
            break
        case 'number':
            result = datetime?.toString()
            break
    }
    return moment.tz(result || '', 'YYYY:MM:DD HH:mm:ss', tz)
}
