import type { IExecuteFunctions } from 'n8n-workflow';
import { TosClient } from '@volcengine/tos-sdk';
import { BaseOperation } from './BaseOperation';

/**
 * 获取对象操作
 * 使用getObject API下载文件内容
 */
export class GetObjectOperation extends BaseOperation {
	constructor() {
		super('获取文件');
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
		const returnBinary = this.getNodeParameter('returnBinary', itemIndex, false) as boolean;
		const bucket = credentials.bucket;

		if (!filePath) {
			throw new Error('缺少必需参数: filePath');
		}
		if (!bucket) {
			throw new Error('缺少必需参数: bucket');
		}

		// 获取对象
		const response = await client.getObject({
			bucket: bucket,
			key: filePath,
		});

		const fileUrl = await super.generatePreSignedUrl(client, bucket, filePath, 'GET', 3600);

		const result: any = {
			downloaded: true,
			url: fileUrl,
			path: filePath,
			bucket,
			metadata: {
				contentLength: response.headers?.['content-length'],
				contentType: response.headers?.['content-type'],
				etag: response.headers?.['etag'],
				lastModified: response.headers?.['last-modified'],
				storageClass: response.headers?.['x-tos-storage-class'],
				versionId: response.headers?.['x-tos-version-id']
			}
		};

		// 如果需要返回二进制数据
		if (returnBinary && response.data) {
			const content = response.data;
			let buffer: Buffer;
			
			if (Buffer.isBuffer(content)) {
				buffer = content;
			} else if (typeof content === 'string') {
				buffer = Buffer.from(content);
			} else {
				// 如果是流或其他类型，转换为Buffer
				buffer = Buffer.from(content as any);
			}

			// 为n8n返回正确的格式：json字段包含元数据，binary字段包含二进制数据
			return {
				json: {
					downloaded: true,
					url: result.url,
					path: filePath,
					bucket,
					size: buffer.length,
					mimeType: response.headers?.['content-type'] || 'application/octet-stream',
					fileName: filePath.split('/').pop() || 'downloaded-file',
					metadata: result.metadata
				},
				binary: {
					[filePath.split('/').pop() || 'downloaded-file']: {
						data: buffer.toString('base64'),
						mimeType: response.headers?.['content-type'] || 'application/octet-stream',
						fileName: filePath.split('/').pop() || 'downloaded-file'
					}
				}
			};
		} else {
			// 如果不返回二进制数据，只返回元数据
			result.size = response.headers?.['content-length'];
		}

		return result;
	}
}