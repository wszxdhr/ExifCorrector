// 通过文件名比较图片的创建时间
import moment from 'moment-timezone';
import { ExifDateTime, Tags } from 'exiftool-vendored'
import { devError, devInfo } from '../../utils/devLog';
import { parseDate } from 'chrono-node'
import { datetimeFormatToReg } from '../../utils/datetimeFormatToReg';

export const localTimeZone = moment.tz.guess()

export const displayDatetimeFormat = 'YYYY-MM-DD HH:mm:ss'

export function exifDateTimeToMoment(exifDateTime: ExifDateTime, exifDateTimeFormat: string) {
    const datetime = exifDateTime.toDateTime().toJSDate()
    return moment(datetime)
}

export function compareOptionToDatetime(compareOptions: string[], exif: Tags, fileNameFormat: string = 'YYYYMMDDHHmmss') {
    const dateTimeKey = compareOptions.find(option => option === 'FileName' || exif[option as keyof Tags] instanceof ExifDateTime)
    if (!dateTimeKey) {
        devError('获取失败，Exif中没有任何一个时间选项有效', compareOptions)
        return null
    }
    const fileName = exif.FileName?.toString() || ''
    const dateTimeFromFileName = moment(fileName.match(datetimeFormatToReg(fileNameFormat))?.[0] || '', fileNameFormat)
    const value = parseDate(dateTimeKey === 'FileName' && dateTimeFromFileName.isValid() ? dateTimeFromFileName.format(displayDatetimeFormat) : exif[dateTimeKey as keyof Tags]?.toString() || '')
    devInfo(value, exif[dateTimeKey as keyof Tags]?.toString())
    if (!value) {
        devError('获取失败，Exif值为空或格式为空 ', 'compareOptions: ', compareOptions, 'value: ', value, 'dateTimeFromFileName: ', dateTimeFromFileName)
        return null
    }
    return moment(value)
}
