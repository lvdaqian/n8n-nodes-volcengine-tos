import type { IExecuteFunctions } from 'n8n-workflow';
import { TosClient } from '@volcengine/tos-sdk';
import type { IOperationExecutor, IOperationResult } from './types';
import { TosErrorHandler } from './errorHandler';

/**
 * 基础操作抽象类
 * 提供所有TOS操作的通用功能和错误处理
 */
export abstract class BaseOperation implements IOperationExecutor {
	protected operationName: string;

	constructor(operationName: string) {
		this.operationName = operationName;
	}

	/**
	 * 执行操作的抽象方法，由子类实现
	 */
	abstract execute(
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

	/**
	 * 安全执行操作，包含错误处理
	 */
	async safeExecute(
		executeFunctions: IExecuteFunctions,
		client: TosClient,
		itemIndex: number,
		credentials: {
			accessKey: string;
			secretKey: string;
			bucket: string;
			region: string;
			endpoint: string;
		}
	): Promise<IOperationResult> {
		try {
			const result = await this.execute.call(
				executeFunctions,
				client,
				itemIndex,
				credentials
			);
			return {
				success: true,
				data: result
			};
		} catch (error) {
			const context = this.getErrorContext(executeFunctions, itemIndex);
			return TosErrorHandler.handleError(
				error,
				this.operationName,
				context,
				credentials
			);
		}
	}

	/**
	 * 获取错误上下文信息
	 */
	protected getErrorContext(
		executeFunctions: IExecuteFunctions,
		itemIndex: number
	): { filePath?: string; bucket?: string } {
		try {
			const filePath = executeFunctions.getNodeParameter('filePath', itemIndex, '') as string;
			const bucket = executeFunctions.getNodeParameter('bucket', itemIndex, '') as string;
			return { filePath, bucket };
		} catch {
			return {};
		}
	}

	/**
	 * 获取通用参数
	 */
	protected getCommonParams(
		executeFunctions: IExecuteFunctions,
		itemIndex: number
	): { filePath: string; bucket?: string } {
		const filePath = executeFunctions.getNodeParameter('filePath', itemIndex, '') as string;
		const bucket = executeFunctions.getNodeParameter('bucket', itemIndex, '') as string;
		return { filePath, bucket };
	}

	/**
	 * 生成文件URL
	 */
	protected generateFileUrl(
		bucket: string,
		region: string,
		filePath: string
	): string {
		return `https://${bucket}.${region}.tos-cn-${region}.bytedance.net/${filePath}`;
	}

	/**
	 * 验证必需参数
	 */
	protected validateRequiredParams(params: Record<string, any>, requiredFields: string[]): void {
		for (const field of requiredFields) {
			if (!params[field]) {
				throw new Error(`缺少必需参数: ${field}`);
			}
		}
	}
}