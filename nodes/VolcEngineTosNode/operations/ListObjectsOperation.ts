import type { IExecuteFunctions } from 'n8n-workflow';
import { TosClient } from '@volcengine/tos-sdk';
import { BaseOperation } from './BaseOperation';

/**
 * 列出对象操作
 * 使用listObjects API列出存储桶中的文件
 */
export class ListObjectsOperation extends BaseOperation {
	constructor() {
		super('列出文件');
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
		const prefix = this.getNodeParameter('prefix', itemIndex, '') as string;
		const maxKeys = this.getNodeParameter('maxKeys', itemIndex, 1000) as number;
		const delimiter = this.getNodeParameter('delimiter', itemIndex, '') as string;
		const marker = this.getNodeParameter('marker', itemIndex, '') as string;
		const bucket = credentials.bucket;

		if (!bucket) {
			throw new Error('缺少必需参数: bucket');
		}

		// 构建请求参数
		const params: any = {
			bucket: bucket,
			maxKeys: maxKeys
		};

		if (prefix) params.prefix = prefix;
		if (delimiter) params.delimiter = delimiter;
		if (marker) params.marker = marker;

		// 列出对象
		const response = await client.listObjects(params);

		const objects = response.data?.Contents?.map((obj: any) => ({
			key: obj.key,
			size: obj.size,
			lastModified: obj.lastModified,
			etag: obj.etag,
			storageClass: obj.storageClass,
			owner: obj.owner,
			url: `https://${bucket}.${credentials.region}.tos-cn-${credentials.region}.bytedance.net/${obj.key}`
		})) || [];

		const commonPrefixes = response.data?.CommonPrefixes?.map((cp: any) => cp.Prefix) || [];

		return {
			objects,
			commonPrefixes,
			bucket,
			prefix: prefix || '',
			marker: response.data?.Marker || '',
			nextMarker: response.data?.NextMarker || '',
			maxKeys,
			isTruncated: response.data?.IsTruncated || false,
			count: objects.length
		};
	}
}