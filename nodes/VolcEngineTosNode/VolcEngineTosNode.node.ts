import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';
import { TosClient } from '@volcengine/tos-sdk';
import { OperationFactory } from './operations/OperationFactory';
import { TosErrorHandler } from './operations/errorHandler';

export class VolcEngineTosNode implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'VolcEngineTos Node',
		name: 'volcEngineTosNode',
		icon: 'file:icon.svg',
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
              name: 'Copy File',
              value: 'copyFile',
              description: 'Copy a file within TOS',
              action: 'Copy a file within TOS',
            },
            {
              name: 'Create Bucket',
              value: 'createBucket',
              description: 'Create a new TOS bucket',
              action: 'Create a new TOS bucket',
            },
            {
              name: 'Delete Bucket',
              value: 'deleteBucket',
              description: 'Delete a TOS bucket',
              action: 'Delete a TOS bucket',
            },
            {
              name: 'Delete File',
              value: 'deleteFile',
              description: 'Delete a file from TOS',
              action: 'Delete a file from TOS',
            },
            {
              name: 'Download File',
              value: 'downloadFile',
              description: 'Download a file from TOS',
              action: 'Download a file from TOS',
            },
            {
              name: 'Get Pre-Signed URL',
              value: 'getPreSignedUrl',
              description: 'Generate a pre-signed URL for file access',
              action: 'Generate a pre signed url for file access',
            },
            {
              name: 'List Buckets',
              value: 'listBuckets',
              description: 'List all TOS buckets',
              action: 'List all TOS buckets',
            },
            {
              name: 'List Files',
              value: 'listFiles',
              description: 'List files in a TOS bucket',
              action: 'List files in a TOS bucket',
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
              operation: ['checkExistence', 'uploadFile', 'downloadFile', 'deleteFile', 'copyFile', 'getPreSignedUrl'],
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
        },
        {
          displayName: 'HTTP Method',
          name: 'method',
          type: 'options',
          options: [
            {
              name: 'GET',
              value: 'GET',
              description: 'Generate URL for downloading/viewing the file',
            },
            {
              name: 'PUT',
              value: 'PUT',
              description: 'Generate URL for uploading to the file',
            },
          ],
          displayOptions: {
            show: {
              operation: ['getPreSignedUrl'],
            },
          },
          default: 'GET',
          description: 'HTTP method for the pre-signed URL',
        },
        {
          displayName: 'Expires (Seconds)',
          name: 'expires',
          type: 'number',
          displayOptions: {
            show: {
              operation: ['getPreSignedUrl'],
            },
          },
          default: 1800,
          description: 'URL Expiration Time in Seconds (Default: 1800 = 30 Minutes)',
        },
        {
          displayName: 'Version ID',
          name: 'versionId',
          type: 'string',
          displayOptions: {
            show: {
              operation: ['getPreSignedUrl'],
            },
          },
          default: '',
          description: 'Specific version ID of the object (optional)',
        },
        {
          displayName: 'Content Type',
          name: 'contentType',
          type: 'string',
          displayOptions: {
            show: {
              operation: ['getPreSignedUrl'],
            },
          },
          default: '',
          description: 'Override the Content-Type header in the response (optional)',
        },
        {
          displayName: 'Content Disposition',
          name: 'contentDisposition',
          type: 'string',
          displayOptions: {
            show: {
              operation: ['getPreSignedUrl'],
            },
          },
          default: '',
          description: 'Override the Content-Disposition header in the response (optional)',
        },
        {
          displayName: 'Prefix Filter',
          name: 'prefix',
          type: 'string',
          displayOptions: {
            show: {
              operation: ['listFiles'],
            },
          },
          default: '',
          description: 'Filter files by prefix (optional)',
        },
        {
          displayName: 'Maximum Number',
          name: 'maxKeys',
          type: 'number',
          displayOptions: {
            show: {
              operation: ['listFiles'],
            },
          },
          default: 1000,
          description: 'Maximum number of files to return (default: 1000)',
        },
        {
          displayName: 'Delimiter',
          name: 'delimiter',
          type: 'string',
          displayOptions: {
            show: {
              operation: ['listFiles'],
            },
          },
          default: '',
          description: 'Delimiter for grouping files (optional)',
        },
        {
          displayName: 'Marker',
          name: 'marker',
          type: 'string',
          displayOptions: {
            show: {
              operation: ['listFiles'],
            },
          },
          default: '',
          description: 'Start listing from this marker (for pagination, optional)',
        }
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0) as string;

		// Get credentials
		const credentials = await this.getCredentials('volcEngineTOSApi');

		if (!credentials) {
			throw new NodeOperationError(this.getNode(), 'No credentials returned!');
		}

		// Initialize TOS client
		const tosClient = new TosClient({
			accessKeyId: credentials.accessKey as string,
			accessKeySecret: credentials.secretKey as string,
			region: credentials.region as string,
			endpoint: credentials.endpoint as string,
		});

		// Get operation executor
		const operationExecutor = OperationFactory.getOperation(operation);

		// Process each input item
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				// Execute operation using the factory pattern
				const responseData = await operationExecutor.execute.call(
					this,
					tosClient,
					itemIndex,
					{
						accessKey: credentials.accessKey as string,
						secretKey: credentials.secretKey as string,
						bucket: credentials.bucket as string,
						region: credentials.region as string,
						endpoint: credentials.endpoint as string,
					}
				);

				// 检查是否是下载操作返回的特殊格式（包含json和binary字段）
				if (responseData && typeof responseData === 'object' && 'json' in responseData && 'binary' in responseData) {
					// 下载操作返回的格式
					returnData.push({
						json: responseData.json,
						binary: {
							data: responseData.binary
						},
						pairedItem: {
							item: itemIndex,
						},
					});
				} else {
					// 其他操作的标准格式
					returnData.push({
						json: responseData,
						pairedItem: {
							item: itemIndex,
						},
					});
				}
			} catch (error: any) {
				// Use centralized error handling
				if (this.continueOnFail()) {
					const errorResult = TosErrorHandler.createContinueOnFailResult(error, operation, itemIndex);
					returnData.push({
						json: errorResult,
						pairedItem: {
							item: itemIndex,
						},
					});
					continue;
				}

				TosErrorHandler.throwNodeError(this, error, itemIndex);
			}
		}

		return [returnData];
	}
}
