import { PutObjectOperation } from '../../../../nodes/VolcEngineTosNode/operations/PutObjectOperation';
import { TosClient } from '@volcengine/tos-sdk';
import { IExecuteFunctions } from 'n8n-workflow';

// Mock TOS SDK
jest.mock('@volcengine/tos-sdk');

describe('PutObjectOperation', () => {
	let operation: PutObjectOperation;
	let mockExecuteFunctions: Partial<IExecuteFunctions>;
	let mockTosClient: jest.Mocked<TosClient>;

	beforeEach(() => {
		operation = new PutObjectOperation();

		// Mock IExecuteFunctions
		mockExecuteFunctions = {
			getNodeParameter: jest.fn(),
			getInputData: jest.fn(),
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
			putObject: jest.fn(),
			putObjectAcl: jest.fn(),
			getPreSignedUrl: jest.fn()
		} as any;
	});

	describe('Constructor', () => {
		it('should initialize with correct operation name', () => {
			expect(operation['operationName']).toBe('上传文件');
		});
	});

	describe('execute', () => {
		it('should upload file successfully', async () => {
			// Mock parameters
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('test-bucket/test-file.txt') // filePath
				.mockReturnValueOnce('data') // binaryProperty
				.mockReturnValueOnce(false); // makePublic

			// Mock input data with binary
			(mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue([
				{
					binary: {
						data: {
							data: Buffer.from('test file content'),
							mimeType: 'text/plain',
							fileName: 'test-file.txt'
						}
					}
				}
			]);

			// Mock successful putObject response
			mockTosClient.putObject.mockResolvedValue({
				data: {
					etag: '"abc123"',
					versionId: 'version123'
				}
			} as any);

			(mockTosClient.getPreSignedUrl as jest.Mock).mockResolvedValue(
				'https://test-bucket.cn-north-1.tos-cn-cn-north-1.bytedance.net/test-bucket/test-file.txt'
			);

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

			expect(mockTosClient.putObject).toHaveBeenCalledWith({
				bucket: 'test-bucket',
				key: 'test-bucket/test-file.txt',
				body: Buffer.from('test file content'),
				contentType: 'text/plain'
			});

			expect(result).toEqual({
				uploaded: true,
				path: 'test-bucket/test-file.txt',
				bucket: 'test-bucket',
				url: 'https://test-bucket.cn-north-1.tos-cn-cn-north-1.bytedance.net/test-bucket/test-file.txt',
				retag: undefined,
				versionId: undefined,
				size: 17,
				mimeType: 'text/plain',
				isPublic: false
			});
		});

		it('should upload file and make it public', async () => {
			// Mock parameters
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('test-bucket/public-file.txt') // filePath
				.mockReturnValueOnce('data') // binaryProperty
				.mockReturnValueOnce(true); // makePublic

			// Mock input data with binary
			(mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue([
				{
					binary: {
						data: {
							data: Buffer.from('public file content'),
							mimeType: 'text/plain',
							fileName: 'public-file.txt'
						}
					}
				}
			]);

			// Mock successful responses
			mockTosClient.putObject.mockResolvedValue({
				data: {
					etag: '"def456"',
					versionId: 'version456'
				}
			} as any);

			mockTosClient.putObjectAcl.mockResolvedValue({} as any);

			(mockTosClient.getPreSignedUrl as jest.Mock).mockResolvedValue(
				'https://test-bucket.cn-north-1.tos-cn-cn-north-1.bytedance.net/test-bucket/public-file.txt'
			);

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

			expect(mockTosClient.putObject).toHaveBeenCalled();
			expect(mockTosClient.putObjectAcl).toHaveBeenCalledWith({
				bucket: 'test-bucket',
				key: 'test-bucket/public-file.txt',
				acl: 'public-read'
			});

			expect(result.uploaded).toBe(true);
			expect(result.isPublic).toBe(true);
		});

		it('should throw error when binary data is missing', async () => {
			// Mock parameters
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('test-bucket/test-file.txt') // filePath
				.mockReturnValueOnce('data') // binaryProperty
				.mockReturnValueOnce(false); // makePublic

			// Mock input data without binary
			(mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue([
				{
					json: { test: 'data' }
				}
			]);

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
			).rejects.toThrow('未找到二进制数据');
		});

		it('should validate required parameters', async () => {
			// Mock missing filePath parameter
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('') // empty filePath
				.mockReturnValueOnce('data') // binaryProperty
				.mockReturnValueOnce(false); // makePublic

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
			).rejects.toThrow('缺少必需参数');
		});
	});
});