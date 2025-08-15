import { CreateBucketOperation } from '../../../../nodes/VolcEngineTosNode/operations/CreateBucketOperation';
import { TosClient } from '@volcengine/tos-sdk';
import { IExecuteFunctions } from 'n8n-workflow';

// Mock TOS SDK
jest.mock('@volcengine/tos-sdk');

describe('CreateBucketOperation', () => {
	let operation: CreateBucketOperation;
	let mockExecuteFunctions: Partial<IExecuteFunctions>;
	let mockTosClient: jest.Mocked<TosClient>;

	beforeEach(() => {
		operation = new CreateBucketOperation();

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
			createBucket: jest.fn()
		} as any;
	});

	describe('Constructor', () => {
		it('should initialize with correct operation name', () => {
			expect(operation['operationName']).toBe('创建存储桶');
		});
	});

	describe('execute', () => {
		it('should create bucket successfully', async () => {
			// Mock parameters
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('new-test-bucket'); // bucketName

			// Mock successful createBucket response
			mockTosClient.createBucket.mockResolvedValue({
				headers: {
					location: '/new-test-bucket'
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

			expect(mockTosClient.createBucket).toHaveBeenCalledWith({
				bucket: 'new-test-bucket'
			});

			expect(result).toEqual({
				created: true,
				bucketName: 'new-test-bucket',
				region: 'cn-north-1',
				acl: undefined,
				storageClass: undefined,
				location: '/new-test-bucket',
				url: 'https://new-test-bucket.cn-north-1.tos-cn-cn-north-1.bytedance.net'
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

		it('should handle bucket already exists error', async () => {
			// Mock parameters
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('existing-bucket'); // bucketName

			// Mock bucket already exists error
			const bucketExistsError = new Error('Bucket already exists');
			(bucketExistsError as any).statusCode = 409;
			(bucketExistsError as any).code = 'BucketAlreadyExists';
			mockTosClient.createBucket.mockRejectedValue(bucketExistsError);

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
			).rejects.toThrow('Bucket already exists');
		});

		it('should handle invalid bucket name error', async () => {
			// Mock parameters with invalid bucket name
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('Invalid_Bucket_Name!'); // invalid bucketName

			// Mock invalid bucket name error
			const invalidNameError = new Error('Invalid bucket name');
			(invalidNameError as any).statusCode = 400;
			(invalidNameError as any).code = 'InvalidBucketName';
			mockTosClient.createBucket.mockRejectedValue(invalidNameError);

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
			).rejects.toThrow('Invalid bucket name');
		});

		it('should handle access denied error', async () => {
			// Mock parameters
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('unauthorized-bucket'); // bucketName

			// Mock access denied error
			const accessDeniedError = new Error('Access denied');
			(accessDeniedError as any).statusCode = 403;
			(accessDeniedError as any).code = 'AccessDenied';
			mockTosClient.createBucket.mockRejectedValue(accessDeniedError);

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