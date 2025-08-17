# n8n-nodes-volcengine-tos

[![npm version](https://badge.fury.io/js/n8n-nodes-volcengine-tos.svg)](https://badge.fury.io/js/n8n-nodes-volcengine-tos)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Test Coverage](https://img.shields.io/badge/coverage-94.77%25-brightgreen.svg)]()
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.15-brightgreen.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)]()

English | [中文](./README_CN.md)

> 🚀 **Built with [Trae IDE](https://trae.ai) Vibe Coding** - Welcome to use and submit [Issues](https://github.com/lvdaqian/n8n-nodes-volcengine-tos/issues)!

## ✨ Features

- 🔥 **10+ Operations**: Complete VolcEngine TOS automation with file and bucket management
- 🔐 **Pre-signed URLs**: Secure file access with configurable expiration times
- 🧪 **High Quality**: 94.77% test coverage with 139 unit tests
- 🌐 **Bilingual**: Full English and Chinese documentation
- ⚡ **Type Safe**: Built with TypeScript for better development experience
- 📦 **Easy Setup**: Zero configuration, works out of the box

This is an n8n community node that lets you use VolcEngine TOS (Torch Object Storage) in your n8n workflows.

VolcEngine TOS is a secure, durable, and highly scalable cloud storage service provided by ByteDance's VolcEngine platform. It offers object storage capabilities for storing and retrieving any amount of data from anywhere.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)  
[Compatibility](#compatibility)  
[Usage](#usage)  
[Resources](#resources)  

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

Package name: `n8n-nodes-volcengine-tos`

## Operations

The VolcEngine TOS node supports the following operations:

### File Operations
- **Check File Existence**: Check if a file exists in the specified bucket and get its metadata
- **Upload File**: Upload a binary file to VolcEngine TOS bucket with optional public access configuration
- **Download File**: Download a file from VolcEngine TOS bucket
- **Delete File**: Delete a file from VolcEngine TOS bucket
- **Copy File**: Copy a file within VolcEngine TOS (same or different buckets)
- **List Files**: List files in a VolcEngine TOS bucket with optional prefix filtering
- **Get Pre-Signed URL**: Generate a pre-signed URL for secure file access with configurable expiration time

### Bucket Operations
- **Create Bucket**: Create a new VolcEngine TOS bucket
- **Delete Bucket**: Delete an existing VolcEngine TOS bucket
- **List Buckets**: List all available VolcEngine TOS buckets

## Credentials

To use this node, you need to set up VolcEngine TOS API credentials:

### Prerequisites
1. Sign up for a VolcEngine account at [volcengine.com](https://www.volcengine.com/)
2. Create a TOS bucket in the VolcEngine console
3. Generate Access Key ID and Secret Access Key

### Authentication Setup
1. In n8n, go to **Credentials** and create new **VolcEngine TOS API** credentials
2. Fill in the following information:
   - **Access Key**: Your VolcEngine Access Key ID
   - **Secret Key**: Your VolcEngine Secret Access Key
   - **Bucket**: Your TOS bucket name
   - **Endpoint**: Your TOS service endpoint (e.g., `tos-s3-cn-beijing.volces.com`)
   - **Region**: Your bucket region (e.g., `cn-beijing`)

## Compatibility

- **Minimum n8n version**: 0.198.0
- **Node.js version**: >=20.15
- **Tested with**: n8n 1.x

This node uses the official `@volcengine/tos-sdk` (v2.7.5) for reliable integration with VolcEngine TOS.

## Usage

### Check File Existence
1. Select "Check Existence" operation
2. Provide the file path in the bucket
3. The node will return whether the file exists along with file URL and metadata

### Upload File
1. Select "Upload File" operation
2. Specify the target file path in the bucket
3. Choose the binary property containing the file data
4. Optionally enable "Make Public" to set public-read ACL
5. The node will upload the file and return the file URL and upload details

### Download File
1. Select "Download File" operation
2. Provide the file path in the bucket
3. The node will download the file and return it as binary data

### Copy File
1. Select "Copy File" operation
2. Specify the source file path
3. Specify the destination file path
4. The node will copy the file and return operation details

### List Files
1. Select "List Files" operation
2. Optionally specify a prefix to filter files
3. Set maximum number of files to return
4. The node will return a list of files with metadata

### Get Pre-Signed URL
1. Select "Get Pre-Signed URL" operation
2. Provide the file path in the bucket
3. Choose HTTP method (GET for download/view, PUT for upload)
4. Set expiration time in seconds (default: 1800 = 30 minutes)
5. Optionally specify version ID, content type, or content disposition
6. The node will generate a secure pre-signed URL for temporary file access

### Bucket Management
- **Create Bucket**: Specify bucket name and optional configuration
- **Delete Bucket**: Specify bucket name to delete
- **List Buckets**: Get all available buckets with metadata

### Error Handling
The node includes comprehensive error handling with user-friendly error messages and supports n8n's "Continue on Fail" option for robust workflow execution.

## Testing

### Unit Tests
The project includes comprehensive unit tests for all operations:

```bash
# Run all unit tests (excludes integration tests)
npm test -- --testPathIgnorePatterns=".*\.integration\.test\.ts$"

# Run specific operation tests
npm test -- --testPathPattern="ListBucketsOperation\.test\.ts$"
```

**Test Coverage**: 12 test suites, 80 unit tests covering all operations and error scenarios.

### Integration Tests
Integration tests require real VolcEngine TOS credentials:

```bash
# Set up environment variables
export VOLCENGINE_ACCESS_KEY="your-access-key"
export VOLCENGINE_SECRET_KEY="your-secret-key"
export VOLCENGINE_BUCKET="your-test-bucket"
export VOLCENGINE_REGION="cn-north-1"  # optional
export VOLCENGINE_ENDPOINT=""  # optional

# Run integration tests
npm test -- --testPathPattern="VolcEngineTosNode\.integration\.test\.ts$"

# Run all tests (unit + integration)
npm test
```

**Note**: Integration tests will fail without valid credentials, but unit tests ensure code quality and functionality.

## Architecture

The project follows a modular architecture:

- **Modular Operations**: Each TOS operation is implemented as a separate class
- **Factory Pattern**: `OperationFactory` manages operation instantiation
- **Centralized Error Handling**: `TosErrorHandler` provides consistent error management
- **Type Safety**: Full TypeScript implementation with proper interfaces
- **Base Operation**: Abstract `BaseOperation` class for common functionality

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
* [VolcEngine TOS Documentation](https://www.volcengine.com/docs/6349)
* [VolcEngine TOS SDK Documentation](https://github.com/volcengine/ve-tos-js-sdk)
* [Project Repository](https://github.com/lvdaqian/n8n-nodes-volcengine-tos)


