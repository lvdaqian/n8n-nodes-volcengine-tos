import { ListObjectsOperation } from '../../../../nodes/VolcEngineTosNode/operations/ListObjectsOperation';
import { TosClient } from '@volcengine/tos-sdk';
import { IExecuteFunctions } from 'n8n-workflow';

// Mock TOS SDK
jest.mock('@volcengine/tos-sdk');

describe('ListObjectsOperation', () => {
	let operation: ListObjectsOperation;
	let mockExecuteFunctions: Partial<IExecuteFunctions>;
	let mockTosClient: jest.Mocked<TosClient>;

	beforeEach(() => {
		operation = new ListObjectsOperation();

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
			listObjects: jest.fn()
		} as any;
	});

	describe('Constructor', () => {
		it('should initialize with correct operation name', () => {
			expect(operation['operationName']).toBe('列出文件');
		});
	});

	describe('execute', () => {
		it('should list files successfully with default parameters', async () => {
			// Mock parameters
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('') // prefix
				.mockReturnValueOnce(1000) // maxKeys
				.mockReturnValueOnce(''); // delimiter

			// Mock successful listObjects response
			mockTosClient.listObjects.mockResolvedValue({
				data: {
					Contents: [
						{
							key: 'folder/file1.txt',
							lastModified: new Date('2023-01-01T00:00:00Z'),
							etag: '"abc123"',
							size: 1024,
							storageClass: 'STANDARD',
							owner: {
								id: 'owner123',
								displayName: 'Test Owner'
							}
						},
						{
							key: 'folder/file2.txt',
							lastModified: new Date('2023-01-02T00:00:00Z'),
							etag: '"def456"',
							size: 2048,
							storageClass: 'STANDARD',
							owner: {
								id: 'owner456',
								displayName: 'Test Owner 2'
							}
						}
					],
					CommonPrefixes: [
						{ Prefix: 'images/' },
						{ Prefix: 'documents/' }
					],
					IsTruncated: false,
					MaxKeys: 1000,
					KeyCount: 2
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

			expect(mockTosClient.listObjects).toHaveBeenCalledWith({
				bucket: 'test-bucket',
				maxKeys: 1000
			});

			const expectedFiles = [
				{
					key: 'folder/file1.txt',
					lastModified: new Date('2023-01-01T00:00:00Z'),
					etag: '"abc123"',
					size: 1024,
					storageClass: 'STANDARD',
					owner: {
						id: 'owner123',
						displayName: 'Test Owner'
					},
					url: 'https://tos-s3-cn-north-1.volces.com/test-bucket/folder/file1.txt'
				},
				{
					key: 'folder/file2.txt',
					lastModified: new Date('2023-01-02T00:00:00Z'),
					etag: '"def456"',
					size: 2048,
					storageClass: 'STANDARD',
					owner: {
						id: 'owner456',
						displayName: 'Test Owner 2'
					},
					url: 'https://tos-s3-cn-north-1.volces.com/test-bucket/folder/file2.txt'
				}
			];
			const expectedFolders = ['images/', 'documents/'];

			expect(result).toEqual({
				files: expectedFiles,
				folders: expectedFolders,
				bucket: 'test-bucket',
				prefix: '',
				marker: '',
				nextMarker: '',
				maxKeys: 1000,
				isTruncated: false,
				totalFiles: 2,
				totalFolders: 2,
				// Backward compatibility
				objects: expectedFiles,
				commonPrefixes: expectedFolders,
				count: 2
			});
		});

		it('should list files with prefix filter', async () => {
			// Mock parameters with prefix
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('images/') // prefix
				.mockReturnValueOnce(100) // maxKeys
				.mockReturnValueOnce(''); // delimiter

			// Mock filtered response
			mockTosClient.listObjects.mockResolvedValue({
				data: {
					Contents: [
						{
							key: 'images/photo1.jpg',
							lastModified: new Date('2023-01-01T00:00:00Z'),
							etag: '"img123"',
							size: 5120,
							storageClass: 'STANDARD'
						}
					],
					CommonPrefixes: [],
					IsTruncated: false,
					MaxKeys: 100,
					KeyCount: 1
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

			expect(mockTosClient.listObjects).toHaveBeenCalledWith({
				bucket: 'test-bucket',
				prefix: 'images/',
				maxKeys: 100
			});

			expect(result.files).toHaveLength(1);
			expect(result.files[0].key).toBe('images/photo1.jpg');
			// Test backward compatibility
			expect(result.objects).toHaveLength(1);
			expect(result.objects[0].key).toBe('images/photo1.jpg');
		});

		it('should handle empty bucket', async () => {
			// Mock parameters
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('') // prefix
				.mockReturnValueOnce(1000) // maxKeys
				.mockReturnValueOnce(''); // delimiter

			// Mock empty response
			mockTosClient.listObjects.mockResolvedValue({
				data: {
					Contents: [],
					CommonPrefixes: [],
					IsTruncated: false,
					MaxKeys: 1000,
					KeyCount: 0
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
				files: [],
				folders: [],
				bucket: 'test-bucket',
				prefix: '',
				marker: '',
				nextMarker: '',
				maxKeys: 1000,
				isTruncated: false,
				totalFiles: 0,
				totalFolders: 0,
				// Backward compatibility
				objects: [],
				commonPrefixes: [],
				count: 0
			});
		});

		it('should handle listing errors', async () => {
			// Mock parameters
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('') // prefix
				.mockReturnValueOnce(1000) // maxKeys
				.mockReturnValueOnce(''); // delimiter

			// Mock listing error
			const listError = new Error('Access denied');
			(listError as any).statusCode = 403;
			mockTosClient.listObjects.mockRejectedValue(listError);

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