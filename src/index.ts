#!/usr/bin/env node

import { Command } from 'commander';
import { version } from '../package.json';
import { processImageDatetime } from './commands/image-datetime';
import { i18n, t } from './i18n/config';
import { unitOfTime } from 'moment-timezone';
import { listFiles } from './commands/list';
import { catFiles } from './commands/cat';

const DEFAULT_FILE_NAME_FORMAT = [
  'YYYYMMDDHHmmss',
  'YYYY-MM-DD_HHmmss',
  'YYYY-MM-DD_HH-mm-ss',
  'YYYYMMDD_HHmmss',
  'YYYYMMDD_HH-mm-ss',
  'YYYYMMDD-HHmmss',
  'YYYYMMDD-HH-mm-ss',
  'YYYY_MM_DD_HH_mm_ss',
  'YYYY-MM-DD HH:mm:ss'
];

const DEFAULT_COMPARE = [
  'CreateDate',
  'DateCreated',
  'FileModifyDate',
  'DateTimeOriginal'
]

/**
 * 主命令行程序类
 * 遵循单一职责原则,负责命令行解析和路由
 */
class ExifDog {
  private program: Command;

  constructor() {
    this.program = new Command();
  }

  /**
   * 配置命令行程序
   */
  private setupProgram(): void {
    this.program
      .name('exif-dog')
      .description(t('app.description'))
      .version(version)

    this.program
      .option('-v, --version')
      .action(() => {
        console.log(version);
        process.exit(0);
      })
    this.program
      .command('image-datetime <folder>')
      .description(t('cli.help.options.imageDatetime'))
      .option('-b, --compare-base <base>', t('cli.help.options.compareBase'))
      .option('-g, --granularity <granularity>', t('cli.help.options.granularity'), 'second')
      .option('-c, --compare <compare>', t('cli.help.options.compare'), (val: string) => val.split(','))
      .option('-ff, --file-name-format <fileNameFormat>', t('cli.help.options.fileNameFormat'), (val: string) => val ? val.split(',') : DEFAULT_FILE_NAME_FORMAT)
      .option('-r, --recursive', t('cli.help.options.recursive'))
      .option('-y, --yes', t('cli.help.options.yes'))
      .option('-f, --filter <filter>', t('cli.help.options.filter'), '')
      .option('--count <count>', t('cli.help.options.count'), 'Infinity')
      // .option('-t, --threads <threads>', t('cli.help.options.threads'), '1')
      .action(async (folder: string, options: { compareBase: string, ext: string[], granularity: unitOfTime.StartOf, compare: string[], fileNameFormat: string[], recursive: boolean, yes: boolean, filter: string, threads: string, count: string }) => {
        options.fileNameFormat = options.fileNameFormat || DEFAULT_FILE_NAME_FORMAT;
        options.compare = options.compare || DEFAULT_COMPARE;
        options.compareBase = options.compareBase || 'FileName';
        await processImageDatetime(folder, options);
      })
    this.program
      .command('list <folder>')
      .description(t('cli.help.options.list'))
      .option('-f, --filter <filter>', t('cli.help.options.filter'), '')
      .option('-r, --recursive', t('cli.help.options.recursive'))
      .action(async (folder: string, options: { filter: string, recursive: boolean }) => {
        await listFiles(folder, options.filter, options.recursive);
      })
    this.program
      .command('cat <folder>')
      .description(t('cli.help.options.cat'))
      .option('-f, --filter <filter>', t('cli.help.options.filter'), '')
      .option('-r, --recursive', t('cli.help.options.recursive'))
      .option('-k, --keys <keys>', t('cli.help.options.keys'), (val: string) => val.split(','))
      .action(async (folder: string, options: { filter: string, recursive: boolean, keys?: string[] }) => {
        await catFiles(folder, options.filter, options.recursive, options.keys);
      })
  }

  /**
   * 运行命令行程序
   */
  public async run(): Promise<void> {
    // 初始化i18n
    await i18n.initialize();

    // 先解析参数以获取语言选项
    this.program.parseOptions(process.argv);
    const options = this.program.opts();

    // 如果有语言选项，先设置语言
    if (options.language) {
      await i18n.changeLanguage(options.language);
    }

    // 然后设置程序（此时会使用正确的语言）
    this.setupProgram();

    // 重新解析所有参数
    this.program.parse(process.argv);
  }
}

// 程序入口
const cli = new ExifDog();
cli.run().catch((error) => {
  console.error('Failed to start CLI:', error);
  process.exit(1);
});