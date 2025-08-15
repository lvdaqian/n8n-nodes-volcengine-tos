import type { IExecuteFunctions } from 'n8n-workflow';
import { TosClient } from '@volcengine/tos-sdk';
import { BaseOperation } from './BaseOperation';

/**
 * 删除存储桶操作
 * 使用deleteBucket API删除存储桶
 */
export class DeleteBucketOperation extends BaseOperation {
	constructor() {
		super('删除存储桶');
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
		const bucketName = this.getNodeParameter('bucketName', itemIndex, credentials.bucket) as string;

		if (!bucketName) {
			throw new Error('缺少必需参数: bucketName');
		}

		// 删除存储桶
		await client.deleteBucket(bucketName);

		return {
			deleted: true,
			bucketName,
			region: credentials.region
		};
	}
}