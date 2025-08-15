import { HeadObjectOperation } from '../../../../nodes/VolcEngineTosNode/operations/HeadObjectOperation';
import { TosClient } from '@volcengine/tos-sdk';
import { IExecuteFunctions } from 'n8n-workflow';

// Mock TOS SDK
jest.mock('@volcengine/tos-sdk');

describe('HeadObjectOperation', () => {
	let operation: HeadObjectOperation;
	let mockExecuteFunctions: Partial<IExecuteFunctions>;
	let mockTosClient: jest.Mocked<TosClient>;

	beforeEach(() => {
		operation = new HeadObjectOperation();

		// Mock IExecuteFunctions
		mockExecuteFunctions = {
			getNodeParameter: jest.fn(),
			getNode: jest.fn(() => ({
				id: 'test-node',
				name: 'Test Node',
				type: 'volcEngineTosNode',
				typeVersion: 1,
				position: [0, 0],
				parameters: {}
			}))
		} as any;

		// Mock TosClient
		mockTosClient = {
			headObject: jest.fn()
		} as any;
	});

	describe('Constructor', () => {
		it('should initialize with correct operation name', () => {
			expect(operation['operationName']).toBe('检查文件存在性');
		});
	});

	describe('execute', () => {
		it('should get file metadata successfully', async () => {
			// Mock parameters
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('test-bucket/test-file.txt'); // filePath

			// Mock successful headObject response
			mockTosClient.headObject.mockResolvedValue({
				data: {
					contentLength: 1024,
					contentType: 'text/plain',
					etag: '"abc123"',
					lastModified: new Date('2023-01-01T00:00:00Z'),
					versionId: 'version123',
					storageClass: 'STANDARD',
					metadata: {
						'custom-key': 'custom-value',
						'author': 'test-user'
					}
				}
			} as any);

			const credentials = {
				accessKey: 'test-access-key',
				secretKey: 'test-secret-key',
				bucket: 'test-bucket',
				region: 'cn-north-1',
				endpoint: 'https://tos-s3-cn-north-1.volces.com'
			};

			const result = await operation.execute.call(
				mockExecuteFunctions as IExecuteFunctions,
				mockTosClient,
				0,
				credentials
			);

			expect(mockTosClient.headObject).toHaveBeenCalledWith({
				bucket: 'test-bucket',
				key: 'test-bucket/test-file.txt'
			});

			expect(result).toEqual({
				exists: true,
				path: 'test-bucket/test-file.txt',
				bucket: 'test-bucket',
				url: 'https://test-bucket.cn-north-1.tos-cn-cn-north-1.bytedance.net/test-bucket/test-file.txt',
				metadata: {
					contentLength: 1024,
					contentType: 'text/plain',
					etag: '"abc123"',
					lastModified: new Date('2023-01-01T00:00:00.000Z'),
					versionId: 'version123',
					storageClass: 'STANDARD'
				}
			});
		});

		it('should handle file not found', async () => {
			// Mock parameters
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('test-bucket/nonexistent-file.txt'); // filePath

			// Mock 404 error
			const notFoundError = {
				statusCode: 404,
				code: 'NoSuchKey',
				message: 'Object not found'
			};
			mockTosClient.headObject.mockRejectedValue(notFoundError);

			const credentials = {
				accessKey: 'test-access-key',
				secretKey: 'test-secret-key',
				bucket: 'test-bucket',
				region: 'cn-north-1',
				endpoint: 'https://tos-s3-cn-north-1.volces.com'
			};

			const result = await operation.execute.call(
				mockExecuteFunctions as IExecuteFunctions,
				mockTosClient,
				0,
				credentials
			);

			expect(result).toEqual({
				exists: false,
				path: 'test-bucket/nonexistent-file.txt',
				bucket: 'test-bucket',
				error: 'Object not found'
			});
		});

		it('should handle non-404 errors', async () => {
			// Mock parameters
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('test-bucket/forbidden-file.txt'); // filePath

			// Mock 403 error
			const accessDeniedError = new Error('Access denied');
			(accessDeniedError as any).statusCode = 403;
			(accessDeniedError as any).code = 'AccessDenied';
			mockTosClient.headObject.mockRejectedValue(accessDeniedError);

			const credentials = {
				accessKey: 'test-access-key',
				secretKey: 'test-secret-key',
				bucket: 'test-bucket',
				region: 'cn-north-1',
				endpoint: 'https://tos-s3-cn-north-1.volces.com'
			};

			await expect(
				operation.execute.call(
					mockExecuteFunctions as IExecuteFunctions,
					mockTosClient,
					0,
					credentials
				)
			).rejects.toThrow('Access denied');
		});

		it('should validate required parameters', async () => {
			// Mock missing filePath parameter
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce(''); // empty filePath

			const credentials = {
				accessKey: 'test-access-key',
				secretKey: 'test-secret-key',
				bucket: 'test-bucket',
				region: 'cn-north-1',
				endpoint: 'https://tos-s3-cn-north-1.volces.com'
			};

			await expect(
				operation.execute.call(
					mockExecuteFunctions as IExecuteFunctions,
					mockTosClient,
					0,
					credentials
				)
			).rejects.toThrow('缺少必需参数: filePath');
		});

		it('should handle minimal metadata response', async () => {
			// Mock parameters
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('test-bucket/minimal-file.txt'); // filePath

			// Mock minimal headObject response
			mockTosClient.headObject.mockResolvedValue({
				data: {
					contentLength: 512,
					contentType: 'application/octet-stream',
					etag: '"minimal123"',
					lastModified: new Date('2023-01-01T12:00:00Z')
					// No versionId, storageClass, or metadata
				}
			} as any);

			const credentials = {
				accessKey: 'test-access-key',
				secretKey: 'test-secret-key',
				bucket: 'test-bucket',
				region: 'cn-north-1',
				endpoint: 'https://tos-s3-cn-north-1.volces.com'
			};

			const result = await operation.execute.call(
				mockExecuteFunctions as IExecuteFunctions,
				mockTosClient,
				0,
				credentials
			);

			expect(result).toEqual({
				exists: true,
				path: 'test-bucket/minimal-file.txt',
				bucket: 'test-bucket',
				url: 'https://test-bucket.cn-north-1.tos-cn-cn-north-1.bytedance.net/test-bucket/minimal-file.txt',
				metadata: {
					contentLength: 512,
					contentType: 'application/octet-stream',
					etag: '"minimal123"',
					lastModified: new Date('2023-01-01T12:00:00.000Z'),
					storageClass: undefined,
					versionId: undefined
				}
			});
		});
	});
});