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
				}

				returnData.push({ json: result });
			} catch (error) {
				// This node should never fail but we want to showcase how
				// to handle errors.
				if (this.continueOnFail()) {
					returnData.push({ json: this.getInputData(itemIndex)[0].json, error, pairedItem: itemIndex });
				} else {
					// Adding `itemIndex` allows other workflows to handle this error
					if (error.context) {
						// If the error thrown already contains the context property,
						// only append the itemIndex
						error.context.itemIndex = itemIndex;
						throw error;
					}
					throw new NodeOperationError(this.getNode(), error, {
						itemIndex,
					});
				}
			}
		}

		return [returnData];
	}
}
