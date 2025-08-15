import { ListBucketsOperation } from '../../../../nodes/VolcEngineTosNode/operations/ListBucketsOperation';
import { TosClient } from '@volcengine/tos-sdk';
import { IExecuteFunctions } from 'n8n-workflow';

// Mock TOS SDK
jest.mock('@volcengine/tos-sdk');

describe('ListBucketsOperation', () => {
	let operation: ListBucketsOperation;
	let mockExecuteFunctions: Partial<IExecuteFunctions>;
	let mockTosClient: jest.Mocked<TosClient>;

	beforeEach(() => {
		operation = new ListBucketsOperation();

		// Mock IExecuteFunctions
		mockExecuteFunctions = {
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
			listBuckets: jest.fn()
		} as any;
	});

	describe('Constructor', () => {
		it('should initialize with correct operation name', () => {
			expect(operation['operationName']).toBe('列出存储桶');
		});
	});

	describe('execute', () => {
		it('should list buckets successfully', async () => {
			// Mock successful listBuckets response
			mockTosClient.listBuckets.mockResolvedValue({
				data: {
					Buckets: [
						{
							Name: 'bucket-1',
							CreationDate: new Date('2023-01-01T00:00:00Z')
						},
						{
							Name: 'bucket-2',
							CreationDate: new Date('2023-01-02T00:00:00Z')
						},
						{
							Name: 'bucket-3',
							CreationDate: new Date('2023-01-03T00:00:00Z')
						}
					]
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

			expect(mockTosClient.listBuckets).toHaveBeenCalledWith();

			expect(result).toEqual({
				buckets: [
					{
						name: 'bucket-1',
						creationDate: new Date('2023-01-01T00:00:00Z'),
						region: 'cn-north-1',
						url: 'https://bucket-1.cn-north-1.tos-cn-cn-north-1.bytedance.net'
					},
					{
						name: 'bucket-2',
						creationDate: new Date('2023-01-02T00:00:00Z'),
						region: 'cn-north-1',
						url: 'https://bucket-2.cn-north-1.tos-cn-cn-north-1.bytedance.net'
					},
					{
						name: 'bucket-3',
						creationDate: new Date('2023-01-03T00:00:00Z'),
						region: 'cn-north-1',
						url: 'https://bucket-3.cn-north-1.tos-cn-cn-north-1.bytedance.net'
					}
				],
				count: 3
			});
		});

		it('should handle empty bucket list', async () => {
			// Mock empty response
			mockTosClient.listBuckets.mockResolvedValue({
				data: {
					Buckets: []
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
				buckets: [],
				count: 0
			});
		});

		it('should handle listing errors', async () => {
			// Mock listing error
			const listError = new Error('Access denied');
			(listError as any).statusCode = 403;
			(listError as any).code = 'AccessDenied';
			mockTosClient.listBuckets.mockRejectedValue(listError);

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

		it('should handle invalid credentials error', async () => {
			// Mock invalid credentials error
			const invalidCredentialsError = new Error('Invalid credentials');
			(invalidCredentialsError as any).statusCode = 401;
			(invalidCredentialsError as any).code = 'InvalidAccessKeyId';
			mockTosClient.listBuckets.mockRejectedValue(invalidCredentialsError);

			const credentials = {
				accessKey: 'invalid-access-key',
				secretKey: 'invalid-secret-key',
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
			).rejects.toThrow('Invalid credentials');
		});
	});
});