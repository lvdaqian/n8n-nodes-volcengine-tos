# n8n-nodes-volcengine-tos

[![npm version](https://badge.fury.io/js/n8n-nodes-volcengine-tos.svg)](https://badge.fury.io/js/n8n-nodes-volcengine-tos)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Test Coverage](https://img.shields.io/badge/coverage-94.77%25-brightgreen.svg)]()
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.15-brightgreen.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)]()

[English](./README.md) | 中文

> 🚀 **本项目通过 [Trae IDE](https://trae.ai) 氛围编程构建** - 欢迎大家使用并提交 [Issue](https://github.com/lvdaqian/n8n-nodes-volcengine-tos/issues)！

## ✨ 特性

- 🔥 **10+ 操作**: 完整的火山引擎 TOS 自动化，支持文件和存储桶管理
- 🔐 **预签名 URL**: 安全的文件访问，支持可配置的过期时间
- 🧪 **高质量**: 94.77% 测试覆盖率，139 个单元测试
- 🌐 **双语支持**: 完整的中英文文档
- ⚡ **类型安全**: 使用 TypeScript 构建，提供更好的开发体验
- 📦 **简单设置**: 零配置，开箱即用

这是一个 n8n 社区节点，让您可以在 n8n 工作流中使用火山引擎 TOS（对象存储服务）。

火山引擎 TOS 是由字节跳动火山引擎平台提供的安全、持久且高度可扩展的云存储服务。它提供对象存储功能，可以从任何地方存储和检索任意数量的数据。

[n8n](https://n8n.io/) 是一个[公平代码许可](https://docs.n8n.io/reference/license/)的工作流自动化平台。

[安装](#安装)  
[操作](#操作)  
[凭据](#凭据)  
[兼容性](#兼容性)  
[使用方法](#使用方法)  
[资源](#资源)  

## 安装

请按照 n8n 社区节点文档中的[安装指南](https://docs.n8n.io/integrations/community-nodes/installation/)进行操作。

包名：`n8n-nodes-volcengine-tos`

## 操作

火山引擎 TOS 节点支持以下操作：

### 文件操作
- **检查文件存在性**：检查指定存储桶中的文件是否存在并获取其元数据
- **上传文件**：将二进制文件上传到火山引擎 TOS 存储桶，可选择公共访问配置
- **下载文件**：从火山引擎 TOS 存储桶下载文件
- **删除文件**：从火山引擎 TOS 存储桶删除文件
- **复制文件**：在火山引擎 TOS 内复制文件（相同或不同存储桶）
- **列出文件**：列出火山引擎 TOS 存储桶中的文件，支持前缀过滤
- **获取预签名URL**：生成用于安全文件访问的预签名URL，支持可配置的过期时间

### 存储桶操作
- **创建存储桶**：创建新的火山引擎 TOS 存储桶
- **删除存储桶**：删除现有的火山引擎 TOS 存储桶
- **列出存储桶**：列出所有可用的火山引擎 TOS 存储桶

## 凭据

要使用此节点，您需要设置火山引擎 TOS API 凭据：

### 前提条件
1. 在 [volcengine.com](https://www.volcengine.com/) 注册火山引擎账户
2. 在火山引擎控制台中创建 TOS 存储桶
3. 生成访问密钥 ID 和秘密访问密钥

### 身份验证设置
1. 在 n8n 中，转到**凭据**并创建新的**火山引擎 TOS API**凭据
2. 填写以下信息：
   - **访问密钥**：您的火山引擎访问密钥 ID
   - **秘密密钥**：您的火山引擎秘密访问密钥
   - **存储桶**：您的 TOS 存储桶名称
   - **端点**：您的 TOS 服务端点（例如：`tos-s3-cn-beijing.volces.com`）
   - **区域**：您的存储桶区域（例如：`cn-beijing`）

## 兼容性

- **最低 n8n 版本**：0.198.0
- **Node.js 版本**：>=20.15
- **测试版本**：n8n 1.x

此节点使用官方 `@volcengine/tos-sdk`（v2.7.5）以确保与火山引擎 TOS 的可靠集成。

## 使用方法

### 检查文件存在性
1. 选择"检查存在性"操作
2. 提供存储桶中的文件路径
3. 节点将返回文件是否存在以及文件 URL 和元数据

### 上传文件
1. 选择"上传文件"操作
2. 指定存储桶中的目标文件路径
3. 选择包含文件数据的二进制属性
4. 可选择启用"公开访问"以设置公共读取 ACL
5. 节点将上传文件并返回文件 URL 和上传详情

### 下载文件
1. 选择"下载文件"操作
2. 提供存储桶中的文件路径
3. 节点将下载文件并以二进制数据形式返回

### 复制文件
1. 选择"复制文件"操作
2. 指定源文件路径
3. 指定目标文件路径
4. 节点将复制文件并返回操作详情

### 列出文件
1. 选择"列出文件"操作
2. 配置可选参数：
   - **前缀过滤**：按前缀过滤文件（例如，"images/" 仅列出 images 文件夹中的文件）
   - **最大数量**：限制返回的文件数量（默认：1000）
   - **分隔符**：按公共前缀分组文件（用于类似文件夹的结构）
   - **标记**：从特定文件开始列出（用于分页）
3. 节点返回增强的输出格式：
   - `files`：包含元数据的文件对象数组
   - `folders`：文件夹前缀数组
   - `totalFiles`：返回的文件数量
   - `totalFolders`：文件夹前缀数量
   - 为保持向后兼容性，保留旧字段（`objects`、`commonPrefixes`）

### 获取预签名URL
1. 选择"获取预签名URL"操作
2. 提供存储桶中的文件路径
3. 选择HTTP方法（GET用于下载/查看，PUT用于上传）
4. 设置过期时间（秒）（默认：1800 = 30分钟）
5. 可选择指定版本ID、内容类型或内容处置
6. 节点将生成用于临时文件访问的安全预签名URL

### 存储桶管理
- **创建存储桶**：指定存储桶名称和可选配置
- **删除存储桶**：指定要删除的存储桶名称
- **列出存储桶**：获取所有可用存储桶及其元数据

### 错误处理
节点包含全面的错误处理，提供用户友好的错误消息，并支持 n8n 的"失败时继续"选项以确保工作流的稳健执行。

## 测试

### 单元测试
项目包含所有操作的全面单元测试：

```bash
# 运行所有单元测试（排除集成测试）
npm test -- --testPathIgnorePatterns=".*\.integration\.test\.ts$"

# 运行特定操作测试
npm test -- --testPathPattern="ListBucketsOperation\.test\.ts$"
```

**测试覆盖率**：12 个测试套件，80 个单元测试，覆盖所有操作和错误场景。

### 集成测试
集成测试需要真实的火山引擎 TOS 凭据：

```bash
# 设置环境变量
export VOLCENGINE_ACCESS_KEY="your-access-key"
export VOLCENGINE_SECRET_KEY="your-secret-key"
export VOLCENGINE_BUCKET="your-test-bucket"
export VOLCENGINE_REGION="cn-north-1"  # 可选
export VOLCENGINE_ENDPOINT=""  # 可选

# 运行集成测试
npm test -- --testPathPattern="VolcEngineTosNode\.integration\.test\.ts$"

# 运行所有测试（单元 + 集成）
npm test
```

**注意**：没有有效凭据时集成测试会失败，但单元测试确保代码质量和功能性。

## 架构

项目采用模块化架构：

- **模块化操作**：每个 TOS 操作都作为单独的类实现
- **工厂模式**：`OperationFactory` 管理操作实例化
- **集中式错误处理**：`TosErrorHandler` 提供一致的错误管理
- **类型安全**：完整的 TypeScript 实现，具有适当的接口
- **基础操作**：抽象 `BaseOperation` 类提供通用功能

## 资源

* [n8n 社区节点文档](https://docs.n8n.io/integrations/#community-nodes)
* [火山引擎 TOS 文档](https://www.volcengine.com/docs/6349)
* [火山引擎 TOS SDK 文档](https://github.com/volcengine/ve-tos-js-sdk)
* [项目仓库](https://github.com/lvdaqian/n8n-nodes-volcengine-tos)