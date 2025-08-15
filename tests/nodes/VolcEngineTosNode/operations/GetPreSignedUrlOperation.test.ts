import { GetPreSignedUrlOperation } from '../../../../nodes/VolcEngineTosNode/operations/GetPreSignedUrlOperation';
import { TosClient } from '@volcengine/tos-sdk';
import { IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

// Mock TOS SDK
jest.mock('@volcengine/tos-sdk');

describe('GetPreSignedUrlOperation', () => {
	let operation: GetPreSignedUrlOperation;
	let mockExecuteFunctions: Partial<IExecuteFunctions>;
	let mockTosClient: jest.Mocked<TosClient>;

	beforeEach(() => {
		operation = new GetPreSignedUrlOperation();

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
			getPreSignedUrl: jest.fn()
		} as any;
	});

	const mockCredentials = {
		accessKey: 'test-access-key',
		secretKey: 'test-secret-key',
		bucket: 'test-bucket',
		region: 'test-region',
		endpoint: 'test-endpoint'
	};

	describe('execute', () => {
		it('should generate pre-signed URL with default parameters', async () => {
			const mockInputData = [{
				json: {
					filePath: 'test/file.txt'
				}
			}];

			(mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue(mockInputData);
			(mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation((paramName: string) => {
				switch (paramName) {
					case 'filePath': return 'test/file.txt';
					case 'method': return 'GET';
					case 'expires': return 1800;
					default: return undefined;
				}
			});

			const expectedUrl = 'https://test-bucket.test-region.tos-cn-test-region.bytedance.net/test/file.txt?signature=test';
			(mockTosClient.getPreSignedUrl as jest.Mock).mockResolvedValue(expectedUrl);

			const result = await operation.execute.call(mockExecuteFunctions as IExecuteFunctions, mockTosClient, 0, mockCredentials);

			expect(mockTosClient.getPreSignedUrl).toHaveBeenCalledWith({
				bucket: 'test-bucket',
				key: 'test/file.txt',
				method: 'GET',
				expires: 1800
			});

			expect(result).toEqual({
				preSignedUrl: expectedUrl,
				bucket: 'test-bucket',
				filePath: 'test/file.txt',
				method: 'GET',
				expires: 1800,
			versionId: undefined,
			contentType: undefined,
			contentDisposition: undefined
		});
		});

		it('should generate pre-signed URL with PUT method', async () => {
			const mockInputData = [{
				json: {
					filePath: 'upload/file.txt'
				}
			}];

			(mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue(mockInputData);
			(mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation((paramName: string) => {
				switch (paramName) {
					case 'filePath': return 'upload/file.txt';
					case 'method': return 'PUT';
					case 'expires': return 3600;
					default: return undefined;
				}
			});

			const expectedUrl = 'https://test-bucket.test-region.tos-cn-test-region.bytedance.net/upload/file.txt?signature=test-put';
			(mockTosClient.getPreSignedUrl as jest.Mock).mockResolvedValue(expectedUrl);

			const result = await operation.execute.call(mockExecuteFunctions as IExecuteFunctions, mockTosClient, 0, mockCredentials);

			expect(mockTosClient.getPreSignedUrl).toHaveBeenCalledWith({
				bucket: 'test-bucket',
				key: 'upload/file.txt',
				method: 'PUT',
				expires: 3600
			});

			expect(result).toEqual({
				preSignedUrl: expectedUrl,
				bucket: 'test-bucket',
				filePath: 'upload/file.txt',
				method: 'PUT',
				expires: 3600,
				versionId: undefined,
				contentType: undefined,
				contentDisposition: undefined
			});
		});

		it('should throw error when filePath is missing', async () => {
			const mockInputData = [{
				json: {}
			}];

			(mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue(mockInputData);
			(mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation((paramName: string) => {
				switch (paramName) {
					case 'filePath': return '';
					case 'method': return 'GET';
					case 'expires': return 1800;
					default: return undefined;
				}
			});

			await expect(operation.execute.call(mockExecuteFunctions as IExecuteFunctions, mockTosClient, 0, mockCredentials))
				.rejects.toThrow(NodeOperationError);
		});

		it('should handle TOS SDK errors', async () => {
			const mockInputData = [{
				json: {
					filePath: 'test/file.txt'
				}
			}];

			(mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue(mockInputData);
			(mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation((paramName: string) => {
				switch (paramName) {
					case 'filePath': return 'test/file.txt';
					case 'method': return 'GET';
					case 'expires': return 1800;
					default: return undefined;
				}
			});

			(mockTosClient.getPreSignedUrl as jest.Mock).mockImplementation(() => {
				throw new Error('TOS SDK Error');
			});

			await expect(operation.execute.call(mockExecuteFunctions as IExecuteFunctions, mockTosClient, 0, mockCredentials))
				.rejects.toThrow('TOS SDK Error');
		});

		it('should validate expires parameter range', async () => {
			const mockInputData = [{
				json: {
					filePath: 'test/file.txt'
				}
			}];

			(mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue(mockInputData);
			(mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation((paramName: string) => {
				switch (paramName) {
					case 'filePath': return 'test/file.txt';
					case 'method': return 'GET';
					case 'expires': return 604801; // > 7 days
					default: return undefined;
				}
			});

			await expect(operation.execute.call(mockExecuteFunctions as IExecuteFunctions, mockTosClient, 0, mockCredentials))
				.rejects.toThrow(NodeOperationError);
		});
	});
});