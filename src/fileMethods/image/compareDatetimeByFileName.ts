// 通过文件名比较图片的创建时间
import moment from 'moment-timezone';
import { ExifDateTime, Tags } from 'exiftool-vendored'
import { devError, devLog } from '../../utils/devLog';
import { datetimeFormatToReg } from '../../utils/datetimeFormatToReg';

export const localTimeZone = moment.tz.guess()

export const displayDatetimeFormat = 'YYYY-MM-DD HH:mm:ss'

export const exifDatetimeMap = {
    CreateDate: 'YYYY:MM:DD HH:mm:ss',
    FileAccessDate: 'YYYY:MM:DD HH:mm:ss',
    FileInodeChangeDate: 'YYYY:MM:DD HH:mm:ss',
    FileModifyDate: 'YYYY:MM:DD HH:mm:ss',
    FileName: 'YYYY-MM-DD HH:mm:ss',
    MediaCreateDate: 'YYYY:MM:DD HH:mm:ss',
    MediaModifyDate: 'YYYY:MM:DD HH:mm:ss',
    ModifyDate: 'YYYY:MM:DD HH:mm:ss',
    TrackCreateDate: 'YYYY:MM:DD HH:mm:ss',
    TrackModifyDate: 'YYYY:MM:DD HH:mm:ss',
} as const

export function exifDateTimeToMoment(exifDateTime: ExifDateTime, exifDateTimeFormat: string) {
    const datetime = exifDateTime.toDateTime().toJSDate()
    return moment(datetime)
}

export function compareOptionToDatetime(compareOption: keyof typeof exifDatetimeMap, exif: Tags, format?: string) {
    devLog(`正在从${exif.FileName} 的Exif中获取时间，比较选项：${compareOption}`)
    const value = exif[compareOption]
    const _format = format || exifDatetimeMap[compareOption]
    if (!value || value === '' || !_format) {
        devError('获取失败，Exif值为空或格式为空 ', 'value: ', value, 'format: ', _format)
        return null
    }
    if (value instanceof ExifDateTime) {
        devLog('Exif value is ExifDateTime', value.toDateTime().toFormat('yyyyMMDDHHmmss'))
        return exifDateTimeToMoment(value, _format)
    }
    if (typeof value === 'string') {
        devLog('Exif value is string', value)
        // 先匹配
        const timeString = datetimeFormatToReg(_format).exec(value)
        if (timeString) {
            devLog('通过正则处理后的时间字符串：', timeString[0])
            return moment.tz(timeString[0], _format, localTimeZone)
        }
        devError('Exif value string not match format', value, _format)
    }
    devError('获取失败')
    return null
}
