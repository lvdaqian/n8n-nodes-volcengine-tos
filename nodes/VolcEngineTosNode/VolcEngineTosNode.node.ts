import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';
import { TosClient } from '@volcengine/tos-sdk';

export class VolcEngineTosNode implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'VolcEngineTos Node',
		name: 'volcEngineTosNode',
		group: ['output'],
		version: 1,
		description: 'Interact with VolcEngine Cloud Object Storage (TOS/TOD)',
		defaults: {
			name: 'VolcEngineTos Node',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'volcEngineTOSApi',
				required: true,
			},
		],
		properties: [

        {
          displayName: 'Operation',
          name: 'operation',
          type: 'options',
          noDataExpression: true,
          options: [
            {
              name: 'Check File Existence',
              action: 'Check if a file exists in TOS and get its URL',
              value: 'checkExistence',
              description: 'Check if a file exists in TOS and get its URL',
            },
            {
              name: 'Upload Binary File',
              action: 'Upload a binary file to TOS and get its URL',
              value: 'uploadFile',
              description: 'Upload a binary file to TOS and get its URL',
            },
          ],
          default: 'checkExistence',
        },
        {
          displayName: 'File Path',
          name: 'filePath',
          type: 'string',
          required: true,
          displayOptions: {
            show: {
              operation: ['checkExistence', 'uploadFile'],
            },
          },
          default: '',
          description: 'The path and name of the file in TOS',
        },
        {
          displayName: 'Binary Property',
          name: 'binaryProperty',
          type: 'string',
          required: true,
          displayOptions: {
            show: {
              operation: ['uploadFile'],
            },
          },
          default: 'data',
          description: 'The name of the binary property containing the file data',
        },
        {
          displayName: 'Make Public',
          name: 'makePublic',
          type: 'boolean',
          displayOptions: {
            show: {
              operation: ['uploadFile'],
            },
          },
          default: false,
          description: 'Whether to make the uploaded file publicly accessible',
        }
		],
	};

	// The function below is responsible for actually doing whatever this node
	// is supposed to do. In this case, we're just appending the `myString` property
	// with whatever the user has entered.
	// You can make async calls and use `await`.
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const credentials = await this.getCredentials('volcEngineTOSApi');
		const accessKey = credentials.accessKey as string;
		const secretKey = credentials.secretKey as string;
		const bucket = credentials.bucket as string;
		const region = credentials.region as string;
		const endpoint = credentials.endpoint as string;
		const tosClientConfig = {
			accessKeyId: accessKey,
			accessKeySecret: secretKey,
			region,
			endpoint,
		};
		const tosClient = new TosClient(tosClientConfig);


		// Iterates over all input items and processes each one
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			const item = items[itemIndex];
			try {
				const operation = this.getNodeParameter('operation', itemIndex, 'checkExistence') as string;
				const filePath = this.getNodeParameter('filePath', itemIndex, '') as string;
				const binaryProperty = this.getNodeParameter('binaryProperty', itemIndex, 'data') as string;
				const makePublic = this.getNodeParameter('makePublic', itemIndex, false) as boolean;
				let result: any = {};

				if (operation === 'checkExistence') {
					await tosClient.headObject({
						bucket: bucket,
						key: filePath,
					});

					const fileUrl = endpoint ? `${endpoint}/${filePath}` : `https://${bucket}.${region}.tos-cn-${region}.bytedance.net/${filePath}`;

					result = {
						exists: true, // 如果headObject没有抛出异常，说明文件存在
						url: fileUrl,
						path: filePath,
						bucket,
					}
				} else if (operation === 'uploadFile') {

					if (!item.binary || !item.binary[binaryProperty]) {
						throw new NodeOperationError(this.getNode(), 'No binary data found in the item');
					}
					const fileData = item.binary[binaryProperty];
					const fileBuffer = Buffer.from(fileData.data, 'base64');
					await tosClient.putObject({
						bucket: bucket,
						key: filePath,
						body: fileBuffer,
						contentType: fileData.mimeType,
					});

					if (makePublic) {
						await tosClient.putObjectAcl({
							bucket: bucket,
							key: filePath,
							acl: TosClient.ACLType.ACLPublicRead,
						});
					}

					const fileUrl = endpoint ? `${endpoint}/${filePath}` : `https://${bucket}.${region}.tos-cn-${region}.bytedance.net/${filePath}`;
					result = {
						uploaded: true,
						url: fileUrl,
						path: filePath,
						bucket,
						size: fileBuffer.length,
						mimeType: fileData.mimeType,
					}
				} else {
					throw new NodeOperationError(this.getNode(), `不支持的操作类型: ${operation}`);
				}

				returnData.push({ json: result });
			} catch (error) {
				// 提供友好的错误处理和提示
				let friendlyMessage = '';
				let errorDetails = '';

				// 获取当前操作的参数
				const operation = this.getNodeParameter('operation', itemIndex, 'checkExistence') as string;
				const currentFilePath = this.getNodeParameter('filePath', itemIndex, '') as string;

				// 根据错误类型提供友好的错误信息
				if (error.message && error.message.includes('No binary data found')) {
					friendlyMessage = '未找到二进制数据：请确保上游节点提供了文件数据，并检查二进制属性名称是否正确。';
				} else if (error.code === 'NoSuchBucket' || error.message?.includes('bucket')) {
					friendlyMessage = `存储桶错误：存储桶 "${bucket}" 不存在或无访问权限。请检查存储桶名称和访问权限配置。`;
				} else if (error.code === 'InvalidAccessKeyId' || error.message?.includes('AccessKey')) {
					friendlyMessage = '访问密钥错误：AccessKey 无效或已过期。请检查凭据配置中的 AccessKey 是否正确。';
				} else if (error.code === 'SignatureDoesNotMatch' || error.message?.includes('SecretKey')) {
					friendlyMessage = '签名错误：SecretKey 不正确。请检查凭据配置中的 SecretKey 是否正确。';
				} else if (error.code === 'NoSuchKey' || error.message?.includes('key')) {
					friendlyMessage = `文件不存在：指定的文件路径 "${currentFilePath}" 在存储桶中不存在。请检查文件路径是否正确。`;
				} else if (error.code === 'AccessDenied') {
					friendlyMessage = '访问被拒绝：当前凭据没有执行此操作的权限。请检查 IAM 权限配置。';
				} else if (error.message?.includes('ENOTFOUND') || error.message?.includes('ECONNREFUSED')) {
					friendlyMessage = `网络连接错误：无法连接到 TOS 服务。请检查网络连接和 endpoint 配置。当前 endpoint: ${endpoint || '默认'}`;
				} else if (error.message?.includes('timeout')) {
					friendlyMessage = '请求超时：TOS 服务响应超时。请稍后重试或检查网络连接。';
				} else if (error.message?.includes('region')) {
					friendlyMessage = `区域配置错误：指定的区域 "${region}" 可能不正确。请检查区域配置。`;
				} else {
					// 通用错误处理
					friendlyMessage = `TOS 操作失败：${error.message || '未知错误'}。请检查配置参数和网络连接。`;
				}

				// 添加操作上下文信息
				const operationName = operation === 'checkExistence' ? '检查文件存在性' : '上传文件';
				errorDetails = `操作: ${operationName}, 文件路径: ${currentFilePath || '未指定'}, 存储桶: ${bucket || '未指定'}`;

				// 创建友好的错误消息
				const enhancedMessage = `${friendlyMessage}\n\n详细信息: ${errorDetails}\n\n原始错误: ${error.message}`;
				
				if (this.continueOnFail()) {
					returnData.push({ 
						json: { 
							...this.getInputData(itemIndex)[0].json, 
							error: friendlyMessage,
							errorDetails,
							originalError: error.message 
						}, 
						error: error, 
						pairedItem: itemIndex 
					});
				} else {
					// Adding `itemIndex` allows other workflows to handle this error
					if (error.context) {
						// If the error thrown already contains the context property,
						// only append the itemIndex
						error.context.itemIndex = itemIndex;
						throw error;
					}
					throw new NodeOperationError(this.getNode(), enhancedMessage, {
						itemIndex,
					});
				}
			}
		}

		return [returnData];
	}
}
