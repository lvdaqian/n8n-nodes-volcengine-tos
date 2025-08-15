import type { IExecuteFunctions } from 'n8n-workflow';
import { TosClient } from '@volcengine/tos-sdk';
import { BaseOperation } from './BaseOperation';

/**
 * 创建存储桶操作
 * 使用createBucket API创建新的存储桶
 */
export class CreateBucketOperation extends BaseOperation {
	constructor() {
		super('创建存储桶');
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
		const bucketName = this.getNodeParameter('bucketName', itemIndex, '') as string;
		const acl = this.getNodeParameter('acl', itemIndex, 'private') as string;
		const storageClass = this.getNodeParameter('storageClass', itemIndex, 'STANDARD') as string;

		if (!bucketName) {
			throw new Error('缺少必需参数: bucketName');
		}

		// 构建请求参数
		const params: any = {
			bucket: bucketName
		};

		if (acl && acl !== 'private') {
			params.acl = acl;
		}

		if (storageClass && storageClass !== 'STANDARD') {
			params.storageClass = storageClass;
		}

		// 创建存储桶
		const response = await client.createBucket(params);

		return {
			created: true,
			bucketName,
			region: credentials.region,
			acl,
			storageClass,
			location: response.headers?.location,
			url: `https://${bucketName}.${credentials.region}.tos-cn-${credentials.region}.bytedance.net`
		};
	}
}