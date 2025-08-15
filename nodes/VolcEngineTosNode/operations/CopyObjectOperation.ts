import type { IExecuteFunctions } from 'n8n-workflow';
import { TosClient } from '@volcengine/tos-sdk';
import { BaseOperation } from './BaseOperation';

/**
 * 复制对象操作
 * 使用copyObject API复制文件
 */
export class CopyObjectOperation extends BaseOperation {
	constructor() {
		super('复制文件');
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
		const sourceBucket = this.getNodeParameter('sourceBucket', itemIndex, credentials.bucket) as string;
		const sourceKey = this.getNodeParameter('sourceKey', itemIndex, '') as string;
		const destinationBucket = this.getNodeParameter('destinationBucket', itemIndex, credentials.bucket) as string;
		const destinationKey = this.getNodeParameter('destinationKey', itemIndex, '') as string;
		const metadataDirective = this.getNodeParameter('metadataDirective', itemIndex, 'COPY') as string;

		if (!sourceKey) {
			throw new Error('缺少必需参数: sourceKey');
		}
		if (!destinationKey) {
			throw new Error('缺少必需参数: destinationKey');
		}
		if (!sourceBucket) {
			throw new Error('缺少必需参数: sourceBucket');
		}
		if (!destinationBucket) {
			throw new Error('缺少必需参数: destinationBucket');
		}

		// 复制对象
		const response = await client.copyObject({
			bucket: destinationBucket,
			key: destinationKey,
			srcBucket: sourceBucket,
			srcKey: sourceKey,
			metadataDirective: metadataDirective as any
		});

		const destinationUrl = await super.generatePreSignedUrl(client, destinationBucket, destinationKey, 'GET', 3600);
		const sourceUrl = await super.generatePreSignedUrl(client, sourceBucket, sourceKey, 'GET', 3600);

		return {
			copied: true,
			source: {
				bucket: sourceBucket,
				key: sourceKey,
				url: sourceUrl
			},
			destination: {
				bucket: destinationBucket,
				key: destinationKey,
				url: destinationUrl
			},
			etag: response.data?.ETag,
			lastModified: response.headers?.['last-modified'],
			versionId: response.headers?.['x-tos-version-id']
		};
	}
}