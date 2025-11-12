import inquirer from 'inquirer'
import { devLog } from '../utils/devLog';
import { scan } from '../fileMethods/scan';
import { t } from '../i18n/config';
import ora from 'ora'
import path from 'path';
import { compareOptionToDatetime, displayDatetimeFormat, localTimeZone } from '../fileMethods/image/compareDatetimeByFileName';
import { getExif, setExif } from '../fileMethods/image/getExif';
import { unitOfTime } from 'moment-timezone'
import { ExifDateTime, Tags } from 'exiftool-vendored';
import { DateTime } from 'luxon';
import chalk from 'chalk';
import fs from 'fs'

// 处理图片日期
export async function processImageDatetime(filePath: string, options: {
    compareBase: string,
    ext: string[],
    granularity: unitOfTime.StartOf,
    // 可能是'YYYYMMDDHHmmss'这种，或者'exif.DateTime'
    compare: string[],
    fileNameFormat: string[],
    recursive?: boolean,
    yes?: boolean,
    filter?: string,
    threads?: string,
    fileLimit: number,
    unmatchLimit: number,
    dirnameIgnored?: string[],
    onlyIncludeDir?: string[]
}) {
    console.log(chalk.bgRedBright.blueBright(t('cli.info.localTimeZone', { timeZone: localTimeZone })))
    if (options.fileLimit !== Infinity) {
        console.log(chalk.bgRedBright.blueBright(t('cli.info.fileLimit', { limit: options.fileLimit })))
    }
    if (options.unmatchLimit !== Infinity) {
        console.log(chalk.bgRedBright.blueBright(t('cli.info.unmatchLimit', { limit: options.unmatchLimit })))
    }
    if (options.dirnameIgnored?.length) {
        console.log(chalk.bgRedBright.blueBright(t('cli.info.dirnameIgnored', { dirnameIgnored: options.dirnameIgnored.join(',') })))
    }
    if (options.onlyIncludeDir?.length) {
        console.log(chalk.bgRedBright.blueBright(t('cli.info.onlyIncludeDir', { onlyIncludeDir: options.onlyIncludeDir.join(',') })))
    }
    options.compareBase = options.compareBase || 'FileName'
    options.compare = options.compare || ['CreateDate']
    devLog(`option: ${JSON.stringify(options)}`)
    const startTime = Date.now()
    const filePaths = await scan(filePath, options.filter, options.recursive);
    await new Promise(resolve => setTimeout(resolve, 5000))
    const table: { [key: string]: string }[] = []
    const files: { filePath: string, exif: Object, base: moment.Moment | null, current: moment.Moment | null }[] = []
    const fileMatchSpinner = ora(t('cli.info.scanningFiles', { count: 0, total: filePaths.length, notMatchedCount: 0 })).start();
    let fileCount = 0
    for (const filePath of filePaths) {
        const dirnames = path.dirname(filePath).split(path.sep)
        if (dirnames.some(dir => options.dirnameIgnored?.includes(dir)) || (options.onlyIncludeDir?.length && !dirnames.some(dir => options.onlyIncludeDir?.includes(dir)))) {
            continue
        }
        const basename = path.basename(filePath)
        const exif = await getExif(filePath)
        const compareDatetime = compareOptionToDatetime(options.compare, exif, options.fileNameFormat)
        const baseDatetime = compareOptionToDatetime([options.compareBase], exif, options.fileNameFormat)

        if (!compareDatetime || !baseDatetime || !compareDatetime.isValid() || !baseDatetime.isValid() || compareDatetime.isSame(baseDatetime, options.granularity || 'second')) {
        } else {
            table.push({
                [t('cli.info.fileName')]: basename,
                [t('cli.info.base')]: baseDatetime.clone().tz(localTimeZone).format(displayDatetimeFormat),
                [t('cli.info.current')]: compareDatetime.clone().tz(localTimeZone).format(displayDatetimeFormat)
            })
            files.push({ filePath, exif, base: baseDatetime, current: compareDatetime })
        }
        fileMatchSpinner.text = t('cli.info.scanningFiles', { count: fileCount++, total: filePaths.length, notMatchedCount: table.length })
        if (table.length >= options.unmatchLimit || fileCount >= options.fileLimit) {
            break
        }
    }
    fileMatchSpinner.stop();
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
                // t('cli.confirm.ignoreFiles'),
                // t('cli.confirm.ignoreAll'),
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

async function modifyAll(files: { filePath: string, exif: Tags, base: moment.Moment | null, current: moment.Moment | null }[], options: { compare: string[] }) {
    const spinner = ora(t('cli.info.modifyingFiles', { count: 0, total: files.length })).start();
    let count = 0
    await Promise.all(files.map(async ({ filePath, exif, base, current }) => {
        if (base && current) {
            for (const compare of options.compare) {
                spinner.text = t('cli.info.processing', { file: filePath }) + `: ${compare}`
                await modifyDatetime(filePath, exif, base, compare)
                spinner.text = t('cli.info.modifyingFiles', { count: count++, total: files.length })
            }
        }
    }))
    spinner.stop();
    console.log(chalk.greenBright(t('common.modifySuccess', { count: files.length })))
    console.log(t('common.goodbye'))
    process.exit(0)
}

// warning: 这里会对exif产生副作用
async function modifyDatetime(filePath: string, exif: Tags, datetime: moment.Moment, compare: string) {
    const compareItem = exif[compare as keyof Tags]
    const newCompareDatetime = DateTime.fromJSDate(datetime.clone().utc().toDate())
    if (compareItem instanceof ExifDateTime) {
        // 这个一定要使用UTC
        const compareDatetime = compareItem.toDateTime()
        if (compareDatetime) {
            await setExif(filePath, {
                [compare]: ExifDateTime.fromDateTime(newCompareDatetime)?.setZone(compareDatetime.zone)
            })
        }
    } else if (typeof compareItem === 'string') {
        // 这个一定要使用UTC
        await setExif(filePath, {
            [compare]: ExifDateTime.fromDateTime(newCompareDatetime)?.setZone('utc')?.toExifString()
        })
    }
}
