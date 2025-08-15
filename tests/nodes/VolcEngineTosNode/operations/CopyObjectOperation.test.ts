import { CopyObjectOperation } from '../../../../nodes/VolcEngineTosNode/operations/CopyObjectOperation';
import { TosClient } from '@volcengine/tos-sdk';
import { IExecuteFunctions } from 'n8n-workflow';

// Mock TOS SDK
jest.mock('@volcengine/tos-sdk');

describe('CopyObjectOperation', () => {
	let operation: CopyObjectOperation;
	let mockExecuteFunctions: Partial<IExecuteFunctions>;
	let mockTosClient: jest.Mocked<TosClient>;

	beforeEach(() => {
		operation = new CopyObjectOperation();

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
			copyObject: jest.fn()
		} as any;
	});

	describe('Constructor', () => {
		it('should initialize with correct operation name', () => {
			expect(operation['operationName']).toBe('复制文件');
		});
	});

	describe('execute', () => {
		it('should copy file successfully', async () => {
			// Mock parameters
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('source-bucket') // sourceBucket
				.mockReturnValueOnce('source-file.txt') // sourceKey
				.mockReturnValueOnce('dest-bucket') // destinationBucket
				.mockReturnValueOnce('dest-file.txt') // destinationKey
				.mockReturnValueOnce('COPY'); // metadataDirective

			// Mock successful copyObject response
			mockTosClient.copyObject.mockResolvedValue({
				data: {
					ETag: '"copied123"'
				},
				headers: {
					'last-modified': '2023-01-01T00:00:00Z',
					'x-tos-version-id': 'copy-version123'
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

			expect(mockTosClient.copyObject).toHaveBeenCalledWith({
				bucket: 'dest-bucket',
				key: 'dest-file.txt',
				srcBucket: 'source-bucket',
				srcKey: 'source-file.txt',
				metadataDirective: 'COPY'
			});

			expect(result).toEqual({
				copied: true,
				source: {
					bucket: 'source-bucket',
					key: 'source-file.txt',
					url: 'https://source-bucket.cn-north-1.tos-cn-cn-north-1.bytedance.net/source-file.txt'
				},
				destination: {
					bucket: 'dest-bucket',
					key: 'dest-file.txt',
					url: 'https://dest-bucket.cn-north-1.tos-cn-cn-north-1.bytedance.net/dest-file.txt'
				},
				etag: '"copied123"',
			lastModified: '2023-01-01T00:00:00Z',
			versionId: 'copy-version123'
			});
		});

		it('should copy file within same bucket', async () => {
			// Mock parameters for same bucket copy
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('test-bucket') // sourceBucket
				.mockReturnValueOnce('folder1/original.txt') // sourceKey
				.mockReturnValueOnce('test-bucket') // destinationBucket
				.mockReturnValueOnce('folder2/copy.txt') // destinationKey
				.mockReturnValueOnce('COPY'); // metadataDirective

			// Mock successful copyObject response
			mockTosClient.copyObject.mockResolvedValue({
				data: {
					etag: '"samebucket123"',
					lastModified: new Date('2023-01-02T00:00:00Z')
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

			expect(mockTosClient.copyObject).toHaveBeenCalledWith({
				bucket: 'test-bucket',
				key: 'folder2/copy.txt',
				srcBucket: 'test-bucket',
				srcKey: 'folder1/original.txt',
				metadataDirective: 'COPY'
			});

			expect(result.copied).toBe(true);
			expect(result.source.key).toBe('folder1/original.txt');
			expect(result.destination.key).toBe('folder2/copy.txt');
		});

		it('should validate source path parameter', async () => {
			// Mock missing sourceKey parameter
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('source-bucket') // sourceBucket
				.mockReturnValueOnce('') // empty sourceKey
				.mockReturnValueOnce('dest-bucket') // destinationBucket
				.mockReturnValueOnce('dest-file.txt') // destinationKey
				.mockReturnValueOnce('COPY'); // metadataDirective

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

		it('should validate destination path parameter', async () => {
			// Mock missing destinationKey parameter
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('source-bucket') // sourceBucket
				.mockReturnValueOnce('source-file.txt') // sourceKey
				.mockReturnValueOnce('dest-bucket') // destinationBucket
				.mockReturnValueOnce('') // empty destinationKey
				.mockReturnValueOnce('COPY'); // metadataDirective

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

		it('should handle copy errors', async () => {
			// Mock parameters
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('nonexistent-bucket') // sourceBucket
				.mockReturnValueOnce('source-file.txt') // sourceKey
				.mockReturnValueOnce('dest-bucket') // destinationBucket
				.mockReturnValueOnce('dest-file.txt') // destinationKey
				.mockReturnValueOnce('COPY'); // metadataDirective

			// Mock copy error
			const copyError = new Error('Source object not found');
			(copyError as any).statusCode = 404;
			mockTosClient.copyObject.mockRejectedValue(copyError);

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
			).rejects.toThrow('Source object not found');
		});
	});
});