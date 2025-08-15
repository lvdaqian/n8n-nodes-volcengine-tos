import type { IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import type { IOperationResult } from './types';

/**
 * 统一的错误处理器
 * 提供友好的错误信息和详细的错误上下文
 */
export class TosErrorHandler {
	/**
	 * 处理TOS操作错误
	 * @param error 原始错误对象
	 * @param operation 操作名称
	 * @param context 操作上下文信息
	 * @param credentials 凭据信息
	 * @returns 格式化的错误结果
	 */
	static handleError(
		error: any,
		operation: string,
		context: { filePath?: string; bucket?: string },
		credentials: { bucket?: string; region?: string; endpoint?: string }
	): IOperationResult {
		let friendlyMessage = '';
		let errorDetails = '';

		// 根据错误类型提供友好的错误信息
		if (error.message && error.message.includes('No binary data found')) {
			friendlyMessage = '未找到二进制数据：请确保上游节点提供了文件数据，并检查二进制属性名称是否正确。';
		} else if (error.code === 'BucketNotEmpty') {
			friendlyMessage = '存储桶不为空：无法删除包含对象的存储桶。请先删除桶内所有对象。';
		} else if (error.code === 'NoSuchBucket' || error.message?.includes('bucket')) {
			friendlyMessage = `存储桶错误：存储桶 "${credentials.bucket || context.bucket}" 不存在或无访问权限。请检查存储桶名称和访问权限配置。`;
		} else if (error.code === 'InvalidAccessKeyId' || error.message?.includes('AccessKey')) {
			friendlyMessage = '访问密钥错误：AccessKey 无效或已过期。请检查凭据配置中的 AccessKey 是否正确。';
		} else if (error.code === 'SignatureDoesNotMatch' || error.message?.includes('SecretKey')) {
			friendlyMessage = '签名错误：SecretKey 不正确。请检查凭据配置中的 SecretKey 是否正确。';
		} else if (error.code === 'NoSuchKey' || error.message?.includes('key')) {
			friendlyMessage = `文件不存在：指定的文件路径 "${context.filePath}" 在存储桶中不存在。请检查文件路径是否正确。`;
		} else if (error.code === 'AccessDenied') {
			friendlyMessage = '访问被拒绝：当前凭据没有执行此操作的权限。请检查 IAM 权限配置。';
		} else if (error.message?.includes('ENOTFOUND') || error.message?.includes('ECONNREFUSED')) {
			friendlyMessage = `网络连接错误：无法连接到 TOS 服务。请检查网络连接和 endpoint 配置。当前 endpoint: ${credentials.endpoint || '默认'}`;
		} else if (error.message?.includes('timeout')) {
			friendlyMessage = '请求超时：TOS 服务响应超时。请稍后重试或检查网络连接。';
		} else if (error.message?.includes('region')) {
			friendlyMessage = `区域配置错误：指定的区域 "${credentials.region}" 可能不正确。请检查区域配置。`;
		} else if (error.code === 'EntityTooLarge') {
			friendlyMessage = '文件过大：上传的文件超过了允许的最大大小限制。请使用分片上传或减小文件大小。';
		} else if (error.code === 'InvalidObjectName') {
			friendlyMessage = `对象名称无效：文件路径 "${context.filePath}" 包含无效字符。请检查文件路径格式。`;
		} else if (error.code === 'ObjectNotInActiveTierError') {
			friendlyMessage = '对象未激活：归档或冷归档对象需要先恢复后才能访问。';
		} else {
			// 通用错误处理
			friendlyMessage = `TOS 操作失败：${error.message || '未知错误'}。请检查配置参数和网络连接。`;
		}

		// 添加操作上下文信息
		errorDetails = `操作: ${operation}, 文件路径: ${context.filePath || '未指定'}, 存储桶: ${credentials.bucket || context.bucket || '未指定'}`;

		return {
			success: false,
			error: friendlyMessage,
			errorDetails,
			originalError: error.message
		};
	}

	/**
	 * 抛出Node操作错误
	 * @param executeFunctions n8n执行函数上下文
	 * @param error 错误对象
	 * @param itemIndex 项目索引
	 */
	static throwNodeError(
		executeFunctions: IExecuteFunctions,
		error: any,
		itemIndex: number
	): never {
		// 如果错误已经是NodeOperationError，直接抛出
		if (error instanceof NodeOperationError) {
			throw error;
		}
		
		// 如果错误有context属性，说明是我们处理过的错误
		if (error.context) {
			error.context.itemIndex = itemIndex;
			throw error;
		}
		
		// 构建错误消息，安全地处理可能不存在的属性
		let enhancedMessage = '';
		
		if (error.error) {
			enhancedMessage += error.error;
		} else if (error.message) {
			enhancedMessage += error.message;
		} else {
			enhancedMessage += '未知错误';
		}
		
		if (error.errorDetails) {
			enhancedMessage += `\n\n详细信息: ${error.errorDetails}`;
		}
		
		if (error.originalError) {
			enhancedMessage += `\n\n原始错误: ${error.originalError}`;
		} else if (error.stack) {
			enhancedMessage += `\n\n堆栈信息: ${error.stack}`;
		}
		
		throw new NodeOperationError(executeFunctions.getNode(), enhancedMessage, {
			itemIndex,
		});
	}

	/**
	 * 创建continueOnFail模式的错误结果
	 * @param error 原始错误对象
	 * @param operation 操作名称
	 * @param itemIndex 项目索引
	 * @returns 错误结果对象
	 */
	static createContinueOnFailResult(
		error: any,
		operation: string,
		itemIndex: number
	): any {
		let friendlyMessage = '';
		
		// 根据错误类型提供友好的错误信息
		if (error.code === 'NoSuchBucket') {
			friendlyMessage = '存储桶不存在或无访问权限';
		} else if (error.code === 'AccessDenied') {
			friendlyMessage = '访问被拒绝，请检查权限配置';
		} else if (error.code === 'InvalidAccessKeyId') {
			friendlyMessage = 'AccessKey无效或已过期';
		} else if (error.code === 'SignatureDoesNotMatch') {
			friendlyMessage = 'SecretKey不正确';
		} else if (error.statusCode === 404) {
			friendlyMessage = '指定的文件或存储桶未找到';
		} else {
			friendlyMessage = error.message || '未知错误';
		}
		
		return {
			error: friendlyMessage,
			operation,
			itemIndex,
			originalError: error.message,
			errorCode: error.code,
			statusCode: error.statusCode
		};
	}
}