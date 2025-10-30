# EXIF Dog

一个基于 TypeScript 的 Node.js 命令行工具,用于处理和修正 EXIF 数据。

## 项目结构

```
ExifDog/
├── src/              # TypeScript 源代码
│   └── index.ts      # 主入口文件
├── bin/              # 可执行文件
│   └── exif-dog
├── dist/             # 编译后的 JavaScript 代码(构建后生成)
├── package.json      # 项目配置
├── tsconfig.json     # TypeScript 配置
└── README.md         # 项目文档
```

## 安装依赖

```bash
yarn install
```

## 开发

```bash
# 开发模式运行(使用 ts-node)
yarn dev

# 监听模式编译
yarn watch
```

## 构建

```bash
yarn build
```

## 使用

构建后可以使用以下命令:

```bash
# 查看帮助
node dist/index.js --help

# 或者使用 yarn start
yarn start -- --help

# 处理文件示例
node dist/index.js process <file-path> -o <output-path>
```

## 特性

- ✅ TypeScript 支持
- ✅ 命令行接口(CLI)
- ✅ 模块化设计
- ✅ 遵循设计模式和原则

## 开发计划

- [ ] 实现 EXIF 数据读取功能
- [ ] 实现 EXIF 数据修正功能
- [ ] 添加单元测试
- [ ] 添加更多命令选项

## 技术栈

- **语言**: TypeScript
- **运行时**: Node.js
- **CLI 框架**: Commander.js
- **构建工具**: TypeScript Compiler

## 许可证

MIT