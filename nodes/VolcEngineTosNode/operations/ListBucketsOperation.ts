import type { IExecuteFunctions } from 'n8n-workflow';
import { TosClient } from '@volcengine/tos-sdk';
import { BaseOperation } from './BaseOperation';

/**
 * 列出存储桶操作
 * 使用listBuckets API列出所有存储桶
 */
export class ListBucketsOperation extends BaseOperation {
	constructor() {
		super('列出存储桶');
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
		// 列出存储桶
		const response = await client.listBuckets();

		const buckets = response.data?.Buckets?.map((bucket: any) => ({
			name: bucket.Name,
			creationDate: bucket.CreationDate,
			region: credentials.region,
			url: `https://${bucket.Name}.${credentials.region}.tos-cn-${credentials.region}.bytedance.net`
		})) || [];

		return {
			buckets,
			count: buckets.length
		};
	}
}