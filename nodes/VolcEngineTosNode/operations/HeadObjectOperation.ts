import type { IExecuteFunctions } from 'n8n-workflow';
import { TosClient } from '@volcengine/tos-sdk';
import { BaseOperation } from './BaseOperation';

/**
 * 检查对象是否存在操作
 * 使用headObject API检查文件是否存在并获取元数据
 */
export class HeadObjectOperation extends BaseOperation {
	constructor() {
		super('检查文件存在性');
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

		try {
			// 调用headObject检查文件是否存在
			const response = await client.headObject({
				bucket: bucket,
				key: filePath,
			});

			const fileUrl = `https://${bucket}.${credentials.region}.tos-cn-${credentials.region}.bytedance.net/${filePath}`;

			return {
				exists: true, // 如果headObject没有抛出异常，说明文件存在
				url: fileUrl,
				path: filePath,
				bucket,
				metadata: {
					contentLength: response.data?.contentLength,
					contentType: response.data?.contentType,
					etag: response.data?.etag,
					lastModified: response.data?.lastModified,
					storageClass: response.data?.storageClass,
					versionId: response.data?.versionId
				}
			};
		} catch (error: any) {
			// 处理404错误（文件不存在）
			if (error.statusCode === 404 || error.code === 'NoSuchKey') {
				return {
					exists: false,
					path: filePath,
					bucket,
					error: error.message || 'Object not found'
				};
			}
			// 重新抛出其他错误
			throw error;
		}
	}
}