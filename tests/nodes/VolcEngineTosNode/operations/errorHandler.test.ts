import { TosErrorHandler } from '../../../../nodes/VolcEngineTosNode/operations/errorHandler';
import { NodeOperationError } from 'n8n-workflow';
import type { IExecuteFunctions } from 'n8n-workflow';

// Mock IExecuteFunctions
const mockExecuteFunctions = {
	getNode: jest.fn().mockReturnValue({ name: 'VolcEngine TOS Node' })
} as unknown as IExecuteFunctions;

describe('TosErrorHandler', () => {
	describe('handleError', () => {
		const defaultContext = { filePath: 'test/file.txt', bucket: 'test-bucket' };
		const defaultCredentials = { bucket: 'test-bucket', region: 'us-east-1', endpoint: 'https://tos.example.com' };

		it('should handle binary data not found error', () => {
			const error = { message: 'No binary data found in input' };
			const result = TosErrorHandler.handleError(error, 'uploadFile', defaultContext, defaultCredentials);

			expect(result.success).toBe(false);
			expect(result.error).toContain('未找到二进制数据');
			expect(result.error).toContain('请确保上游节点提供了文件数据');
			expect(result.originalError).toBe(error.message);
		});

		it('should handle NoSuchBucket error', () => {
			const error = { code: 'NoSuchBucket', message: 'The specified bucket does not exist' };
			const result = TosErrorHandler.handleError(error, 'uploadFile', defaultContext, defaultCredentials);

			expect(result.success).toBe(false);
			expect(result.error).toContain('存储桶错误');
			expect(result.error).toContain('test-bucket');
			expect(result.error).toContain('不存在或无访问权限');
		});

		it('should handle InvalidAccessKeyId error', () => {
			const error = { code: 'InvalidAccessKeyId', message: 'The AWS Access Key Id you provided does not exist' };
			const result = TosErrorHandler.handleError(error, 'uploadFile', defaultContext, defaultCredentials);

			expect(result.success).toBe(false);
			expect(result.error).toContain('访问密钥错误');
			expect(result.error).toContain('AccessKey 无效或已过期');
		});

		it('should handle SignatureDoesNotMatch error', () => {
			const error = { code: 'SignatureDoesNotMatch', message: 'The request signature we calculated does not match' };
			const result = TosErrorHandler.handleError(error, 'uploadFile', defaultContext, defaultCredentials);

			expect(result.success).toBe(false);
			expect(result.error).toContain('签名错误');
			expect(result.error).toContain('SecretKey 不正确');
		});

		it('should handle NoSuchKey error', () => {
			const error = { code: 'NoSuchKey', message: 'The specified key does not exist' };
			const result = TosErrorHandler.handleError(error, 'downloadFile', defaultContext, defaultCredentials);

			expect(result.success).toBe(false);
			expect(result.error).toContain('文件不存在');
			expect(result.error).toContain('test/file.txt');
		});

		it('should handle AccessDenied error', () => {
			const error = { code: 'AccessDenied', message: 'Access Denied' };
			const result = TosErrorHandler.handleError(error, 'uploadFile', defaultContext, defaultCredentials);

			expect(result.success).toBe(false);
			expect(result.error).toContain('访问被拒绝');
			expect(result.error).toContain('IAM 权限配置');
		});

		it('should handle network connection errors', () => {
			const error = { message: 'ENOTFOUND tos.example.com' };
			const result = TosErrorHandler.handleError(error, 'uploadFile', defaultContext, defaultCredentials);

			expect(result.success).toBe(false);
			expect(result.error).toContain('网络连接错误');
			expect(result.error).toContain('endpoint 配置');
			expect(result.error).toContain('https://tos.example.com');
		});

		it('should handle timeout errors', () => {
			const error = { message: 'Request timeout after 30000ms' };
			const result = TosErrorHandler.handleError(error, 'uploadFile', defaultContext, defaultCredentials);

			expect(result.success).toBe(false);
			expect(result.error).toContain('请求超时');
			expect(result.error).toContain('稍后重试');
		});

		it('should handle region configuration errors', () => {
			const error = { message: 'Invalid region specified' };
			const result = TosErrorHandler.handleError(error, 'uploadFile', defaultContext, defaultCredentials);

			expect(result.success).toBe(false);
			expect(result.error).toContain('区域配置错误');
			expect(result.error).toContain('us-east-1');
		});

		it('should handle EntityTooLarge error', () => {
			const error = { code: 'EntityTooLarge', message: 'Your proposed upload exceeds the maximum allowed size' };
			const result = TosErrorHandler.handleError(error, 'uploadFile', defaultContext, defaultCredentials);

			expect(result.success).toBe(false);
			expect(result.error).toContain('文件过大');
			expect(result.error).toContain('分片上传');
		});

		it('should handle InvalidObjectName error', () => {
			const error = { code: 'InvalidObjectName', message: 'The specified object name is not valid' };
			const result = TosErrorHandler.handleError(error, 'uploadFile', defaultContext, defaultCredentials);

			expect(result.success).toBe(false);
			expect(result.error).toContain('对象名称无效');
			expect(result.error).toContain('test/file.txt');
		});

		it('should handle BucketNotEmpty error', () => {
			const error = { code: 'BucketNotEmpty', message: 'The bucket you tried to delete is not empty' };
			const result = TosErrorHandler.handleError(error, 'deleteBucket', defaultContext, defaultCredentials);

			expect(result.success).toBe(false);
			expect(result.error).toContain('存储桶不为空');
			expect(result.error).toContain('先删除桶内所有对象');
		});

		it('should handle ObjectNotInActiveTierError error', () => {
			const error = { code: 'ObjectNotInActiveTierError', message: 'The object is in archive storage class' };
			const result = TosErrorHandler.handleError(error, 'downloadFile', defaultContext, defaultCredentials);

			expect(result.success).toBe(false);
			expect(result.error).toContain('对象未激活');
			expect(result.error).toContain('先恢复后才能访问');
		});

		it('should handle generic errors', () => {
			const error = { message: 'Some unknown error occurred' };
			const result = TosErrorHandler.handleError(error, 'uploadFile', defaultContext, defaultCredentials);

			expect(result.success).toBe(false);
			expect(result.error).toContain('TOS 操作失败');
			expect(result.error).toContain('Some unknown error occurred');
		});

		it('should include operation context in errorDetails', () => {
			const error = { message: 'Test error' };
			const result = TosErrorHandler.handleError(error, 'uploadFile', defaultContext, defaultCredentials);

			expect(result.errorDetails).toContain('操作: uploadFile');
			expect(result.errorDetails).toContain('文件路径: test/file.txt');
			expect(result.errorDetails).toContain('存储桶: test-bucket');
		});

		it('should handle missing context information gracefully', () => {
			const error = { message: 'Test error' };
			const result = TosErrorHandler.handleError(error, 'uploadFile', {}, {});

			expect(result.errorDetails).toContain('文件路径: 未指定');
			expect(result.errorDetails).toContain('存储桶: 未指定');
		});
	});

	describe('throwNodeError', () => {
		it('should throw NodeOperationError if error is already NodeOperationError', () => {
			const originalError = new NodeOperationError(mockExecuteFunctions.getNode(), 'Original error');
			
			expect(() => {
				TosErrorHandler.throwNodeError(mockExecuteFunctions, originalError, 0);
			}).toThrow(NodeOperationError);
			expect(() => {
				TosErrorHandler.throwNodeError(mockExecuteFunctions, originalError, 0);
			}).toThrow('Original error');
		});

		it('should throw error with context if error has context property', () => {
			const errorWithContext = {
				message: 'Error with context',
				context: { someProperty: 'value', itemIndex: undefined as number | undefined }
			};
			
			expect(() => {
				TosErrorHandler.throwNodeError(mockExecuteFunctions, errorWithContext, 1);
			}).toThrow();
			
			// 验证itemIndex被添加到context中
			expect(errorWithContext.context.itemIndex).toBe(1);
		});

		it('should create enhanced message from error.error property', () => {
			const error = {
				error: 'Friendly error message',
				errorDetails: 'Additional details',
				originalError: 'Original error message'
			};
			
			expect(() => {
				TosErrorHandler.throwNodeError(mockExecuteFunctions, error, 0);
			}).toThrow(NodeOperationError);
			
			expect(() => {
				TosErrorHandler.throwNodeError(mockExecuteFunctions, error, 0);
			}).toThrow(/Friendly error message/);
			expect(() => {
				TosErrorHandler.throwNodeError(mockExecuteFunctions, error, 0);
			}).toThrow(/Additional details/);
			expect(() => {
				TosErrorHandler.throwNodeError(mockExecuteFunctions, error, 0);
			}).toThrow(/Original error message/);
		});

		it('should create enhanced message from error.message property', () => {
			const error = {
				message: 'Standard error message',
				stack: 'Error stack trace'
			};
			
			expect(() => {
				TosErrorHandler.throwNodeError(mockExecuteFunctions, error, 0);
			}).toThrow(NodeOperationError);
			
			expect(() => {
				TosErrorHandler.throwNodeError(mockExecuteFunctions, error, 0);
			}).toThrow(/Standard error message/);
			expect(() => {
				TosErrorHandler.throwNodeError(mockExecuteFunctions, error, 0);
			}).toThrow(/Error stack trace/);
		});

		it('should handle error with no message', () => {
			const error = {};
			
			expect(() => {
				TosErrorHandler.throwNodeError(mockExecuteFunctions, error, 0);
			}).toThrow(NodeOperationError);
			
			expect(() => {
				TosErrorHandler.throwNodeError(mockExecuteFunctions, error, 0);
			}).toThrow(/未知错误/);
		});
	});

	describe('createContinueOnFailResult', () => {
		it('should create result for NoSuchBucket error', () => {
			const error = { code: 'NoSuchBucket' };
			const result = TosErrorHandler.createContinueOnFailResult(error, 'uploadFile', 0);

			expect(result.error).toBe('存储桶不存在或无访问权限');
			expect(result.operation).toBe('uploadFile');
			expect(result.itemIndex).toBe(0);
		});

		it('should create result for AccessDenied error', () => {
			const error = { code: 'AccessDenied' };
			const result = TosErrorHandler.createContinueOnFailResult(error, 'deleteFile', 1);

			expect(result.error).toBe('访问被拒绝，请检查权限配置');
			expect(result.operation).toBe('deleteFile');
			expect(result.itemIndex).toBe(1);
		});

		it('should create result for InvalidAccessKeyId error', () => {
			const error = { code: 'InvalidAccessKeyId' };
			const result = TosErrorHandler.createContinueOnFailResult(error, 'listFiles', 2);

			expect(result.error).toBe('AccessKey无效或已过期');
			expect(result.operation).toBe('listFiles');
			expect(result.itemIndex).toBe(2);
		});

		it('should create result for SignatureDoesNotMatch error', () => {
			const error = { code: 'SignatureDoesNotMatch' };
			const result = TosErrorHandler.createContinueOnFailResult(error, 'copyFile', 3);

			expect(result.error).toBe('SecretKey不正确');
			expect(result.operation).toBe('copyFile');
			expect(result.itemIndex).toBe(3);
		});

		it('should create result for 404 status code', () => {
			const error = { statusCode: 404 };
			const result = TosErrorHandler.createContinueOnFailResult(error, 'downloadFile', 4);

			expect(result.error).toBe('指定的文件或存储桶未找到');
			expect(result.operation).toBe('downloadFile');
			expect(result.itemIndex).toBe(4);
		});

		it('should create result for generic error with message', () => {
			const error = { message: 'Custom error message' };
			const result = TosErrorHandler.createContinueOnFailResult(error, 'createBucket', 5);

			expect(result.error).toBe('Custom error message');
			expect(result.operation).toBe('createBucket');
			expect(result.itemIndex).toBe(5);
		});

		it('should create result for error without message', () => {
			const error = {};
			const result = TosErrorHandler.createContinueOnFailResult(error, 'deleteBucket', 6);

			expect(result.error).toBe('未知错误');
			expect(result.operation).toBe('deleteBucket');
			expect(result.itemIndex).toBe(6);
		});
	});
});