import type { IExecuteFunctions } from 'n8n-workflow';
import { TosClient } from '@volcengine/tos-sdk';

// 基础操作接口
export interface IOperationExecutor {
	execute(
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
	): Promise<any>;
}

// 操作结果接口
export interface IOperationResult {
	success: boolean;
	data?: any;
	error?: string;
	errorDetails?: string;
	originalError?: string;
}

// TOS客户端配置接口
export interface ITosClientConfig {
	accessKeyId: string;
	accessKeySecret: string;
	region: string;
	endpoint: string;
}

// 操作参数基础接口
export interface IBaseOperationParams {
	bucket?: string;
	key?: string;
}