import type { IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { TosClient } from '@volcengine/tos-sdk';
import { BaseOperation } from './BaseOperation';

/**
 * 上传对象操作
 * 使用putObject API上传文件到TOS
 */
export class PutObjectOperation extends BaseOperation {
	constructor() {
		super('上传文件');
	}

	async execute(
		this: IExecuteFunctions,
		client: TosClient,
		itemIndex: number,
		credentials: {
			accessKey: string;
			secretKey: string;
			bucket: string;
			region: string;
			endpoint: string;
		}
	): Promise<any> {
		const filePath = this.getNodeParameter('filePath', itemIndex, '') as string;
		const binaryProperty = this.getNodeParameter('binaryProperty', itemIndex, 'data') as string;
		const makePublic = this.getNodeParameter('makePublic', itemIndex, false) as boolean;
		const bucket = credentials.bucket;

		if (!filePath) {
			throw new Error('缺少必需参数: filePath');
		}
		if (!bucket) {
			throw new Error('缺少必需参数: bucket');
		}

		// 获取二进制数据
		const item = this.getInputData()[itemIndex];
		if (!item.binary || !item.binary[binaryProperty]) {
			throw new NodeOperationError(this.getNode(), '未找到二进制数据：请确保上游节点提供了文件数据');
		}

		const fileData = item.binary[binaryProperty];
		const fileBuffer = Buffer.from(fileData.data, 'base64');

		// 上传文件
		const uploadResponse = await client.putObject({
			bucket: bucket,
			key: filePath,
			body: fileBuffer,
			contentType: fileData.mimeType,
		});

		// 如果需要设置为公开访问
		if (makePublic) {
			await client.putObjectAcl({
				bucket: bucket,
				key: filePath,
				acl: TosClient.ACLType.ACLPublicRead,
			});
		}

		const fileUrl = await super.generatePreSignedUrl(client, bucket, filePath, 'GET', 3600);

		return {
			uploaded: true,
			url: fileUrl,
			path: filePath,
			bucket,
			size: fileBuffer.length,
			mimeType: fileData.mimeType,
			// etag和versionId可能在响应头中
			retag: uploadResponse.headers?.etag,
			versionId: uploadResponse.headers?.['x-tos-version-id'],
			isPublic: makePublic
		};
	}
}