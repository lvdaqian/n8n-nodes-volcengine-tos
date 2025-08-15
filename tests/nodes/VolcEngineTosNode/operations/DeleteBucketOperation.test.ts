import { DeleteBucketOperation } from '../../../../nodes/VolcEngineTosNode/operations/DeleteBucketOperation';
import { TosClient } from '@volcengine/tos-sdk';
import { IExecuteFunctions } from 'n8n-workflow';

// Mock TOS SDK
jest.mock('@volcengine/tos-sdk');

describe('DeleteBucketOperation', () => {
	let operation: DeleteBucketOperation;
	let mockExecuteFunctions: Partial<IExecuteFunctions>;
	let mockTosClient: jest.Mocked<TosClient>;

	beforeEach(() => {
		operation = new DeleteBucketOperation();

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
			deleteBucket: jest.fn()
		} as any;
	});

	describe('Constructor', () => {
		it('should initialize with correct operation name', () => {
			expect(operation['operationName']).toBe('删除存储桶');
		});
	});

	describe('execute', () => {
		it('should delete bucket successfully', async () => {
			// Mock parameters
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('bucket-to-delete'); // bucketName

			// Mock successful deleteBucket response
			mockTosClient.deleteBucket.mockResolvedValue({} as any);

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

			expect(mockTosClient.deleteBucket).toHaveBeenCalledWith('bucket-to-delete');

			expect(result).toEqual({
				deleted: true,
				bucketName: 'bucket-to-delete',
				region: 'cn-north-1'
			});
		});

		it('should validate required parameters', async () => {
			// Mock missing bucketName parameter
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce(''); // empty bucketName

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
			).rejects.toThrow('缺少必需参数: bucketName');
		});

		it('should handle bucket not found error', async () => {
			// Mock parameters
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('nonexistent-bucket'); // bucketName

			// Mock bucket not found error
			const bucketNotFoundError = new Error('Bucket not found');
			(bucketNotFoundError as any).statusCode = 404;
			(bucketNotFoundError as any).code = 'NoSuchBucket';
			mockTosClient.deleteBucket.mockRejectedValue(bucketNotFoundError);

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
			).rejects.toThrow('Bucket not found');
		});

		it('should handle bucket not empty error', async () => {
			// Mock parameters
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('non-empty-bucket'); // bucketName

			// Mock bucket not empty error
			const bucketNotEmptyError = new Error('Bucket is not empty');
			(bucketNotEmptyError as any).statusCode = 409;
			(bucketNotEmptyError as any).code = 'BucketNotEmpty';
			mockTosClient.deleteBucket.mockRejectedValue(bucketNotEmptyError);

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
			).rejects.toThrow('Bucket is not empty');
		});

		it('should handle access denied error', async () => {
			// Mock parameters
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('unauthorized-bucket'); // bucketName

			// Mock access denied error
			const accessDeniedError = new Error('Access denied');
			(accessDeniedError as any).statusCode = 403;
			(accessDeniedError as any).code = 'AccessDenied';
			mockTosClient.deleteBucket.mockRejectedValue(accessDeniedError);

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
	});
});