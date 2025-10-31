#!/usr/bin/env node

import { Command } from 'commander';
import { version } from '../package.json';
import { processImageDatetime } from './commands/image-datetime';
import { i18n, t } from './i18n/config';
import { exifDatetimeMap } from './fileMethods/image/compareDatetimeByFileName';
import { unitOfTime } from 'moment-timezone';

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
      .option('-e, --ext <ext>', t('cli.help.options.ext'), (val: string) => val.split(','))
      .option('-g, --granularity <granularity>', t('cli.help.options.granularity'), 'second')
      .option('-c, --compare <compare>', t('cli.help.options.compare'), (val: string) => val.split(','))
      .option('-f, --file-name-format <fileNameFormat>', t('cli.help.options.fileNameFormat'))
      .option('-r, --recursive', t('cli.help.options.recursive'))
      .option('-y, --yes', t('cli.help.options.yes'))
      .action(async (folder: string, options: { compareBase: keyof typeof exifDatetimeMap, ext: string[], granularity: unitOfTime.StartOf, compare: (keyof typeof exifDatetimeMap)[], fileNameFormat: string | undefined, recursive: boolean, yes: boolean }) => {
        await processImageDatetime(folder, options);
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