import { GetObjectOperation } from '../../../../nodes/VolcEngineTosNode/operations/GetObjectOperation';
import { TosClient } from '@volcengine/tos-sdk';
import { IExecuteFunctions } from 'n8n-workflow';

// Mock TOS SDK
jest.mock('@volcengine/tos-sdk');

describe('GetObjectOperation', () => {
	let operation: GetObjectOperation;
	let mockExecuteFunctions: Partial<IExecuteFunctions>;
	let mockTosClient: jest.Mocked<TosClient>;

	beforeEach(() => {
		operation = new GetObjectOperation();

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
			getObject: jest.fn(),
			getPreSignedUrl: jest.fn()
		} as any;
	});

	describe('Constructor', () => {
		it('should initialize with correct operation name', () => {
			expect(operation['operationName']).toBe('获取文件');
		});
	});

	describe('execute', () => {
		it('should download file successfully without binary data', async () => {
			// Mock parameters
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('test-bucket/test-file.txt') // filePath
				.mockReturnValueOnce(false); // returnBinary

			// Mock getPreSignedUrl
			mockTosClient.getPreSignedUrl.mockReturnValue('https://test-bucket.tos-cn-north-1.volces.com/test-file.txt?presigned=true');

			// Mock successful getObject response
			mockTosClient.getObject.mockResolvedValue({
				data: Buffer.from('file content'),
				headers: {
					'content-length': '1024',
					'content-type': 'text/plain',
					'etag': '"abc123"',
					'last-modified': 'Wed, 01 Jan 2023 00:00:00 GMT'
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

			expect(mockTosClient.getObject).toHaveBeenCalledWith({
				bucket: 'test-bucket',
				key: 'test-bucket/test-file.txt'
			});

			expect(result).toEqual({
				downloaded: true,
				url: 'https://test-bucket.tos-cn-north-1.volces.com/test-file.txt?presigned=true',
				path: 'test-bucket/test-file.txt',
				bucket: 'test-bucket',
				metadata: {
					contentLength: '1024',
					contentType: 'text/plain',
					etag: '"abc123"',
					lastModified: 'Wed, 01 Jan 2023 00:00:00 GMT',
					storageClass: undefined,
					versionId: undefined
				},
				size: '1024'
			});
		});

		it('should download file successfully with binary data', async () => {
			// Mock parameters
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('test-bucket/test-file.txt') // filePath
				.mockReturnValueOnce(true); // returnBinary

			// Mock getPreSignedUrl
			mockTosClient.getPreSignedUrl.mockReturnValue('https://test-bucket.tos-cn-north-1.volces.com/test-file.txt?presigned=true');

			// Mock successful getObject response
			mockTosClient.getObject.mockResolvedValue({
				data: Buffer.from('file content'),
				headers: {
					'content-length': '1024',
					'content-type': 'text/plain',
					'etag': '"abc123"'
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

			expect(result.downloaded).toBe(true);
			expect(result.binary).toBeDefined();
			expect(result.binary.data.data).toBe(Buffer.from('file content').toString('base64'));
			expect(result.binary.data.mimeType).toBe('text/plain');
			expect(result.binary.data.fileName).toBe('test-file.txt');
		});

		it('should throw error for getObject failures', async () => {
			// Mock parameters
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('test-bucket/test-file.txt') // filePath
				.mockReturnValueOnce(false); // returnBinary

			// Mock access denied error
			const accessError = new Error('Access Denied');
			(accessError as any).statusCode = 403;
			mockTosClient.getObject.mockRejectedValue(accessError);

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
			).rejects.toThrow('Access Denied');
		});

		it('should validate required parameters', async () => {
			// Mock missing filePath parameter
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('') // empty filePath
				.mockReturnValueOnce('test-bucket'); // bucket

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