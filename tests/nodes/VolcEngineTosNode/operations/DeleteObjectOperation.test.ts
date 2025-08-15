import { DeleteObjectOperation } from '../../../../nodes/VolcEngineTosNode/operations/DeleteObjectOperation';
import { TosClient } from '@volcengine/tos-sdk';
import { IExecuteFunctions } from 'n8n-workflow';

// Mock TOS SDK
jest.mock('@volcengine/tos-sdk');

describe('DeleteObjectOperation', () => {
	let operation: DeleteObjectOperation;
	let mockExecuteFunctions: Partial<IExecuteFunctions>;
	let mockTosClient: jest.Mocked<TosClient>;

	beforeEach(() => {
		operation = new DeleteObjectOperation();

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
			deleteObject: jest.fn()
		} as any;
	});

	describe('Constructor', () => {
		it('should initialize with correct operation name', () => {
			expect(operation['operationName']).toBe('删除文件');
		});
	});

	describe('execute', () => {
		it('should delete file successfully', async () => {
			// Mock parameters
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('test-bucket/test-file.txt'); // filePath

			// Mock successful deleteObject response
			mockTosClient.deleteObject.mockResolvedValue({
				headers: {
					'x-tos-version-id': 'version123',
					'x-tos-delete-marker': 'false'
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

			expect(mockTosClient.deleteObject).toHaveBeenCalledWith({
				bucket: 'test-bucket',
				key: 'test-bucket/test-file.txt'
			});

			expect(result).toEqual({
				deleted: true,
				path: 'test-bucket/test-file.txt',
				bucket: 'test-bucket',
				versionId: 'version123',
				deleteMarker: false
			});
		});

		it('should handle delete marker response', async () => {
			// Mock parameters
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('test-bucket/versioned-file.txt'); // filePath

			// Mock deleteObject response with delete marker
			mockTosClient.deleteObject.mockResolvedValue({
				headers: {
					'x-tos-version-id': 'delete-marker-123',
					'x-tos-delete-marker': 'true'
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
				deleted: true,
				path: 'test-bucket/versioned-file.txt',
				bucket: 'test-bucket',
				versionId: 'delete-marker-123',
				deleteMarker: true
			});
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

		it('should handle deletion errors', async () => {
			// Mock parameters
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('test-bucket/nonexistent-file.txt'); // filePath

			// Mock deletion error
			const deleteError = new Error('Object not found');
			(deleteError as any).statusCode = 404;
			mockTosClient.deleteObject.mockRejectedValue(deleteError);

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
			).rejects.toThrow('Object not found');
		});
	});
});