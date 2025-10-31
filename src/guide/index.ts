import { devLog } from '../utils/devLog';
import inquirer from 'inquirer';
import ora from 'ora';

// 所有可能的inquirer prompt类型
export type PromptType = 'input' | 'number' | 'confirm' | 'list' | 'rawlist' | 'expand' | 'checkbox' | 'password' | 'editor';

// 基础Step接口,支持泛型
export interface BaseStep<T = any> {
    name: keyof T & string; // 限制name必须是泛型T的key
    message: string;
    type: PromptType;
    callback?: (answer: any, allAnswers: Partial<T>) => void | Promise<void>;
    when?: (answers: Partial<T>) => boolean | Promise<boolean>;
    validate?: (input: any) => boolean | string | Promise<boolean | string>;
}

// Input类型
export interface InputStep<T = any> extends BaseStep<T> {
    type: 'input';
    default?: string;
    transformer?: (input: string) => string;
}

// Number类型
export interface NumberStep<T = any> extends BaseStep<T> {
    type: 'number';
    default?: number;
}

// Confirm类型
export interface ConfirmStep<T = any> extends BaseStep<T> {
    type: 'confirm';
    default?: boolean;
}

// List类型
export interface ListStep<T = any> extends BaseStep<T> {
    type: 'list';
    choices: Array<string | { name: string; value: any; short?: string }>;
    default?: any;
    loop?: boolean;
}

// Rawlist类型
export interface RawlistStep<T = any> extends BaseStep<T> {
    type: 'rawlist';
    choices: Array<string | { name: string; value: any; short?: string }>;
    default?: any;
}

// Expand类型
export interface ExpandStep<T = any> extends BaseStep<T> {
    type: 'expand';
    choices: Array<{ key: string; name: string; value: any }>;
    default?: any;
}

// Checkbox类型
export interface CheckboxStep<T = any> extends BaseStep<T> {
    type: 'checkbox';
    choices: Array<string | { name: string; value: any; checked?: boolean; disabled?: boolean | string }>;
    loop?: boolean;
}

// Password类型
export interface PasswordStep<T = any> extends BaseStep<T> {
    type: 'password';
    mask?: string;
}

// Editor类型
export interface EditorStep<T = any> extends BaseStep<T> {
    type: 'editor';
    default?: string;
}

// 统一的Step类型
export type Step<T = any> = 
    | InputStep<T>
    | NumberStep<T>
    | ConfirmStep<T>
    | ListStep<T>
    | RawlistStep<T>
    | ExpandStep<T>
    | CheckboxStep<T>
    | PasswordStep<T>
    | EditorStep<T>;

export class Guide<OptionsType extends Record<string, any> = Record<string, any>> {
    private steps: Step<OptionsType>[] = [];
    private answers: Partial<OptionsType> = {};
    private spinner = ora();

    constructor(private options?: {
        showProgress?: boolean; // 是否显示进度
        onComplete?: (answers: Partial<OptionsType>) => void | Promise<void>; // 完成所有步骤后的回调
        transformAnswer?: (answers: Partial<OptionsType>) => OptionsType; // 答案转换函数
    }) {
        devLog('Guide 初始化');
    }

    /**
     * 添加一个步骤
     */
    addStep(step: Step<OptionsType>): this {
        this.steps.push(step);
        return this;
    }

    /**
     * 批量添加步骤
     */
    addSteps(steps: Step<OptionsType>[]): this {
        this.steps.push(...steps);
        return this;
    }

    /**
     * 显示引导流程
     */
    async show(): Promise<Partial<OptionsType>> {
        devLog('开始引导流程');
        
        for (let i = 0; i < this.steps.length; i++) {
            const step = this.steps[i];
            
            // 显示进度
            if (this.options?.showProgress) {
                console.log(`\n[${i + 1}/${this.steps.length}]`);
            }

            // 检查when条件
            if (step.when) {
                const shouldShow = await step.when(this.answers);
                if (!shouldShow) {
                    devLog(`跳过步骤: ${step.name}`);
                    continue;
                }
            }

            // 构建inquirer问题
            const question: any = {
                type: step.type,
                name: step.name,
                message: step.message,
            };

            // 添加类型特定的属性
            if ('default' in step && step.default !== undefined) {
                question.default = step.default;
            }
            if ('choices' in step) {
                question.choices = step.choices;
            }
            if ('loop' in step) {
                question.loop = step.loop;
            }
            if ('mask' in step) {
                question.mask = step.mask;
            }
            if ('transformer' in step) {
                question.transformer = step.transformer;
            }
            if (step.validate) {
                question.validate = step.validate;
            }

            // 执行询问
            const answer = await inquirer.prompt([question]);
            this.answers[step.name] = answer[step.name];

            // 执行回调
            if (step.callback) {
                this.spinner.start('处理中...');
                try {
                    await step.callback(answer[step.name], this.answers);
                    this.spinner.succeed('完成');
                } catch (error) {
                    this.spinner.fail('执行失败');
                    throw error;
                }
            }
        }

        // 执行完成回调
        if (this.options?.onComplete) {
            await this.options.onComplete(this.answers);
        }

        devLog('引导流程完成');
        return this.answers;
    }

    /**
     * 获取所有答案(部分填充)
     */
    getAnswers(): Partial<OptionsType> {
        return { ...this.answers };
    }

    /**
     * 获取完整的Options对象
     * 如果提供了transformAnswer函数,则使用它转换答案
     * 否则直接返回答案(可能不完整)
     */
    getOptions(): OptionsType {
        if (this.options?.transformAnswer) {
            return this.options.transformAnswer(this.answers);
        }
        return this.answers as OptionsType;
    }

    /**
     * 重置引导
     */
    reset(): this {
        this.answers = {};
        return this;
    }

    /**
     * 清空所有步骤
     */
    clearSteps(): this {
        this.steps = [];
        return this;
    }
}
