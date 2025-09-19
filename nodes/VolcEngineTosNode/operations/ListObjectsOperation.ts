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

		const objects = response.data?.Contents?.map((obj: any) => {
			const key = obj.Key || obj.key;
			// 构建正确的URL，使用endpoint或默认格式
			let url: string;
			if (credentials.endpoint) {
				// 如果有自定义endpoint，使用它
				const baseUrl = credentials.endpoint.replace(/\/$/, ''); // 移除末尾斜杠
				url = `${baseUrl}/${bucket}/${key}`;
			} else {
				// 使用默认的TOS URL格式
				url = `https://${bucket}.${credentials.region}.volces.com/${key}`;
			}
			
			return {
				key,
				size: obj.Size || obj.size,
				lastModified: obj.LastModified || obj.lastModified,
				etag: obj.ETag || obj.etag,
				storageClass: obj.StorageClass || obj.storageClass,
				owner: obj.Owner || obj.owner,
				url
			};
		}) || [];

		const commonPrefixes = response.data?.CommonPrefixes?.map((cp: any) => cp.Prefix) || [];

		return {
			files: objects,
			folders: commonPrefixes,
			bucket,
			prefix: prefix || '',
			marker: response.data?.Marker || '',
			nextMarker: response.data?.NextMarker || '',
			maxKeys,
			isTruncated: response.data?.IsTruncated || false,
			totalFiles: objects.length,
			totalFolders: commonPrefixes.length,
			// Keep backward compatibility
			objects,
			commonPrefixes,
			count: objects.length
		};
	}
}