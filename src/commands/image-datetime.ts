import inquirer from 'inquirer'
import { devInfo, devLog } from '../utils/devLog';
import { scanFolder } from '../fileMethods/scan';
import { t } from '../i18n/config';
import ora from 'ora'
import path from 'path';
import { compareOptionToDatetime, displayDatetimeFormat, exifDatetimeMap, localTimeZone } from '../fileMethods/image/compareDatetimeByFileName';
import { datetimeFormatToReg } from '../utils/datetimeFormatToReg';
import { getExif, setExif } from '../fileMethods/image/getExif';
import { unitOfTime } from 'moment-timezone'
import { ExifDateTime, Tags } from 'exiftool-vendored';
import { DateTime } from 'luxon';
import chalk from 'chalk';

// 处理图片日期
export async function processImageDatetime(filePath: string, options: {
    compareBase: keyof typeof exifDatetimeMap,
    ext: string[],
    granularity: unitOfTime.StartOf,
    // 可能是'YYYYMMDDHHmmss'这种，或者'exif.DateTime'
    compare: (keyof typeof exifDatetimeMap)[],
    fileNameFormat: string | undefined,
    recursive?: boolean,
    yes?: boolean
}) {
    console.log(chalk.bgRedBright.blueBright(t('cli.info.localTimeZone', { timeZone: localTimeZone })))
    options.compareBase = options.compareBase || 'FileName'
    options.compare = options.compare || ['CreateDate']
    devLog(`option: ${JSON.stringify(options)}`)
    const startTime = Date.now()
    const fileNameReg = datetimeFormatToReg(options.fileNameFormat || exifDatetimeMap[options.compareBase])
    const spinner = ora(t('cli.info.scanningFiles')).start();
    let count = 0
    const filePaths = await scanFolder(filePath, options.ext, options.recursive, (filePath) => {
        spinner.text = t('cli.info.scanningFiles', { count: ++count }) + `: ${filePath}`
    });
    spinner.stop();

    const table: { [key: string]: string }[] = []
    const files: { filePath: string, exif: Object, base: moment.Moment | null, current: moment.Moment | null }[] = []
    await Promise.all(filePaths.map(async (filePath) => {
        const basename = path.basename(filePath)
        if (!basename.match(fileNameReg)) {
            return
        }
        const exif = await getExif(filePath)
        const compareDatetime = compareOptionToDatetime(options.compare, exif)
        const baseDatetime = compareOptionToDatetime([options.compareBase], exif, options.compareBase === 'FileName' ? options.fileNameFormat : undefined)
        devLog(filePath, compareDatetime, baseDatetime)

        if (!compareDatetime || !baseDatetime || !compareDatetime.isValid() || !baseDatetime.isValid() || compareDatetime.isSame(baseDatetime, options.granularity || 'second')) {
            return
        }
        table.push({
            [t('cli.info.fileName')]: basename,
            [t('cli.info.base')]: baseDatetime.clone().tz(localTimeZone).format(displayDatetimeFormat),
            [t('cli.info.current')]: compareDatetime.clone().tz(localTimeZone).format(displayDatetimeFormat)
        })
        files.push({ filePath, exif, base: baseDatetime, current: compareDatetime })
    }))
    console.table(table)
    if (table.length === 0) {
        console.log(t('cli.imageDatetime.noMatchedFiles', { count: filePaths.length }))
        process.exit(0)
        return
    }
    console.log(t('cli.imageDatetime.afterScanInfo', { count: filePaths.length, matchedCount: table.length, time: (Date.now() - startTime) / 1000 }))

    if (options.yes) {
        await modifyAll(files, options)
        return
    }

    const answers = await inquirer.prompt([
        {
            type: 'rawlist',
            name: 'choice',
            message: t('cli.confirm.choice'),
            choices: [
                t('cli.confirm.modifyAll'),
                t('cli.confirm.ignoreFiles'),
                t('cli.confirm.ignoreAll'),
                t('cli.confirm.scanAgain'),
                t('cli.confirm.cancel')
            ]
        },
    ]);

    switch (answers.choice) {
        case t('cli.confirm.modifyAll'):
            await modifyAll(files, options)
            break;
        case t('cli.confirm.ignoreFiles'):
            break;
        case t('cli.confirm.ignoreAll'):
            break;
        case t('cli.confirm.scanAgain'):
            console.log(t('cli.info.startScanAgain'))
            processImageDatetime(filePath, options)
            break;
        case t('cli.confirm.cancel'):
            console.log(t('common.goodbye'))
            process.exit(0)
            return;
    }
}

async function modifyAll(files: { filePath: string, exif: Tags, base: moment.Moment | null, current: moment.Moment | null }[], options: { compare: (keyof typeof exifDatetimeMap)[] }) {
    const spinner = ora(t('cli.info.modifyingFiles')).start();
    await Promise.all(files.map(async ({ filePath, exif, base, current }) => {
        if (base && current) {
            for (const compare of options.compare) {
                spinner.text = t('cli.info.processing', { file: filePath }) + `: ${compare}`
                await modifyDatetime(filePath, exif, base, compare)
            }
        }
    }))
    spinner.stop();
    console.log(chalk.greenBright(t('common.modifySuccess', { count: files.length })))
    console.log(t('common.goodbye'))
    process.exit(0)
}

// warning: 这里会对exif产生副作用
async function modifyDatetime(filePath: string, exif: Tags, datetime: moment.Moment, compare: keyof typeof exifDatetimeMap) {
    const compareItem = exif[compare]
    const newCompareDatetime = DateTime.fromJSDate(datetime.clone().utc().toDate())
    if (compareItem instanceof ExifDateTime) {
        // 这个一定要使用UTC
        const compareDatetime = compareItem.toDateTime()
        if (compareDatetime) {
            await setExif(filePath, {
                [compare]: ExifDateTime.fromDateTime(newCompareDatetime)?.setZone('utc')
            })
        }
    } else if (typeof compareItem === 'string') {
        // 这个一定要使用UTC
        await setExif(filePath, {
            [compare]: ExifDateTime.fromDateTime(newCompareDatetime)?.setZone('utc')?.toExifString()
        })
    }
}
