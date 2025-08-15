import type { IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { TosClient } from '@volcengine/tos-sdk';
import { BaseOperation } from './BaseOperation';

/**
 * 获取预签名链接操作
 * 支持GET和PUT方法，可自定义过期时间
 */
export class GetPreSignedUrlOperation extends BaseOperation {
	constructor() {
		super('getPreSignedUrl');
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
		const { filePath, bucket } = super.getCommonParams(this, itemIndex);
		const method = this.getNodeParameter('method', itemIndex, 'GET') as 'GET' | 'PUT';
		const expires = this.getNodeParameter('expires', itemIndex, 1800) as number;
		const versionId = this.getNodeParameter('versionId', itemIndex, '') as string;
		const contentType = this.getNodeParameter('contentType', itemIndex, '') as string;
		const contentDisposition = this.getNodeParameter('contentDisposition', itemIndex, '') as string;

		// 验证必需参数
		super.validateRequiredParams(this, { filePath }, ['filePath']);

		// 验证expires参数范围（1-604800秒）
		if (expires < 1 || expires > 604800) {
			throw new NodeOperationError(this.getNode(), 'expires参数必须在1到604800秒之间');
		}

		// 构建预签名URL参数
		const input: any = {
			bucket: bucket || credentials.bucket,
			key: filePath,
			method,
			expires
		};

		// 添加可选参数
		if (versionId) {
			input.versionId = versionId;
		}

		if (contentType || contentDisposition) {
			input.response = {};
			if (contentType) {
				input.response.contentType = contentType;
			}
			if (contentDisposition) {
				input.response.contentDisposition = contentDisposition;
			}
		}

		// 生成预签名URL
		const preSignedUrl = await client.getPreSignedUrl(input);

		return {
			filePath,
			bucket: bucket || credentials.bucket,
			method,
			expires,
			preSignedUrl,
			versionId: versionId || undefined,
			contentType: contentType || undefined,
			contentDisposition: contentDisposition || undefined
		};
	}
}