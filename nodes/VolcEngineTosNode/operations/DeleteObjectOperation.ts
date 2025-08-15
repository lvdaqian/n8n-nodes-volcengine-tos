import type { IExecuteFunctions } from 'n8n-workflow';
import { TosClient } from '@volcengine/tos-sdk';
import { BaseOperation } from './BaseOperation';

/**
 * 删除对象操作
 * 使用deleteObject API删除文件
 */
export class DeleteObjectOperation extends BaseOperation {
	constructor() {
		super('删除文件');
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
		const bucket = credentials.bucket;

		if (!filePath) {
			throw new Error('缺少必需参数: filePath');
		}
		if (!bucket) {
			throw new Error('缺少必需参数: bucket');
		}

		// 删除对象
		const response = await client.deleteObject({
			bucket: bucket,
			key: filePath,
		});

		return {
			deleted: true,
			path: filePath,
			bucket,
			versionId: response.headers?.['x-tos-version-id'],
			deleteMarker: response.headers?.['x-tos-delete-marker'] === 'true'
		};
	}
}