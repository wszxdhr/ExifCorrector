import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import * as path from 'path';
import { devError, devLog } from '../utils/devLog';

/**
 * 国际化配置类
 * 遵循单一职责原则，负责多语言支持
 */
export class I18nConfig {
  private static instance: I18nConfig;
  private initialized = false;

  private constructor() {}

  public static getInstance(): I18nConfig {
    if (!I18nConfig.instance) {
      I18nConfig.instance = new I18nConfig();
    }
    return I18nConfig.instance;
  }

  /**
   * 初始化i18n配置
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      await i18next
        .use(Backend)
        .init({
          fallbackLng: 'en',
          debug: process.env.NODE_ENV === 'development',

          backend: {
            loadPath: path.resolve(__dirname, '../locales/{{lng}}/translation.json'),
            addPath: path.resolve(__dirname, '../locales/{{lng}}/translation.json')
          },

          interpolation: {
            escapeValue: false
          },

          load: 'languageOnly',

          // 默认语言
          lng: this.detectLanguage(),

          // 同步加载
          initImmediate: false,

          // 预加载语言资源
          preload: ['en', 'zh']
        });

      this.initialized = true;
      devLog('i18n 安装完成，当前语言:', i18next.language);
    } catch (error) {
      devError('i18n 安装失败:', error);
      throw error;
    }
  }

  /**
   * 检测系统语言
   */
  private detectLanguage(): string {
    const envLang = process.env.LANG || process.env.LANGUAGE || '';

    if (envLang.startsWith('zh')) {
      return 'zh';
    }

    return 'en';
  }

  /**
   * 切换语言
   */
  public async changeLanguage(language: string): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    await i18next.changeLanguage(language);
  }

  /**
   * 获取当前语言
   */
  public getCurrentLanguage(): string {
    return i18next.language || 'en';
  }

  /**
   * 翻译函数
   */
  public t(key: string, options?: any): string {
    if (!this.initialized) {
      console.warn('i18n not initialized, returning key');
      return key;
    }

    return i18next.t(key, options) as string;
  }
}

// 创建全局翻译函数
export const t = (key: string, options?: any): string => {
  return I18nConfig.getInstance().t(key, options);
};

// 创建全局实例
export const i18n = I18nConfig.getInstance();