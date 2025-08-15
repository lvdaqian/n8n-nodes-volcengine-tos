import { VolcEngineTosNode } from '../../../nodes/VolcEngineTosNode/VolcEngineTosNode.node';
import { NodeOperationError } from 'n8n-workflow';
import type { IExecuteFunctions } from 'n8n-workflow';

// Mock the TOS SDK
jest.mock('@volcengine/tos-sdk', () => {
	return {
		TosClient: jest.fn().mockImplementation(() => {
			return {
				headObject: jest.fn(),
				putObject: jest.fn(),
				putObjectAcl: jest.fn(),
			};
		}),
	};
});

// Mock OperationFactory
jest.mock('../../../nodes/VolcEngineTosNode/operations/OperationFactory', () => {
	return {
		OperationFactory: {
			getOperation: jest.fn(),
		},
	};
});

// Mock TosErrorHandler
jest.mock('../../../nodes/VolcEngineTosNode/operations/errorHandler', () => {
	return {
		TosErrorHandler: {
				throwNodeError: jest.fn(),
				createContinueOnFailResult: jest.fn(),
			},
	};
});

describe('VolcEngineTosNode', () => {
	let node: VolcEngineTosNode;

	beforeEach(() => {
		node = new VolcEngineTosNode();
	});

	describe('Node Description', () => {
		it('should have correct display name', () => {
			expect(node.description.displayName).toBe('VolcEngineTos Node');
		});

		it('should have correct node name', () => {
			expect(node.description.name).toBe('volcEngineTosNode');
		});

		it('should require volcEngineTOSApi credentials', () => {
			const credentials = node.description.credentials;
			expect(credentials).toHaveLength(1);
			expect(credentials![0].name).toBe('volcEngineTOSApi');
			expect(credentials![0].required).toBe(true);
		});

		it('should be in output group', () => {
			expect(node.description.group).toContain('output');
		});

		it('should be usable as tool', () => {
			expect(node.description.usableAsTool).toBe(true);
		});
	});

	describe('Operations', () => {
		it('should support checkExistence operation', () => {
			const operationProperty = node.description.properties.find(
				(prop: any) => prop.name === 'operation'
			);
			expect(operationProperty).toBeDefined();
			if (operationProperty && 'options' in operationProperty) {
				const checkExistenceOption = (operationProperty as any).options.find(
					(option: any) => option.value === 'checkExistence'
				);
				expect(checkExistenceOption).toBeDefined();
				expect(checkExistenceOption.name).toBe('Check File Existence');
			}
		});

		it('should support uploadFile operation', () => {
			const operationProperty = node.description.properties.find(
				(prop: any) => prop.name === 'operation'
			);
			expect(operationProperty).toBeDefined();
			if (operationProperty && 'options' in operationProperty) {
				const uploadFileOption = (operationProperty as any).options.find(
					(option: any) => option.value === 'uploadFile'
				);
				expect(uploadFileOption).toBeDefined();
				expect(uploadFileOption.name).toBe('Upload Binary File');
			}
		});

		it('should have default operation as checkExistence', () => {
			const operationProperty = node.description.properties.find(
				(prop: any) => prop.name === 'operation'
			);
			expect(operationProperty).toBeDefined();
			if (operationProperty) {
				expect((operationProperty as any).default).toBe('checkExistence');
			}
		});
	});

	describe('Properties', () => {
		it('should have filePath property', () => {
			const filePathProperty = node.description.properties.find(
				(prop: any) => prop.name === 'filePath'
			);
			expect(filePathProperty).toBeDefined();
			expect(filePathProperty!.type).toBe('string');
			expect(filePathProperty!.required).toBe(true);
		});

		it('should have binaryProperty property for upload operation', () => {
			const binaryProperty = node.description.properties.find(
				(prop: any) => prop.name === 'binaryProperty'
			);
			expect(binaryProperty).toBeDefined();
			expect(binaryProperty!.type).toBe('string');
			expect(binaryProperty!.default).toBe('data');
		});

		it('should have makePublic property for upload operation', () => {
			const makePublicProperty = node.description.properties.find(
				(prop: any) => prop.name === 'makePublic'
			);
			expect(makePublicProperty).toBeDefined();
			expect(makePublicProperty!.type).toBe('boolean');
			expect(makePublicProperty!.default).toBe(false);
		});
	});

	describe('Execute Function', () => {
		let mockExecuteFunctions: Partial<IExecuteFunctions>;
		let mockOperation: any;

		beforeEach(() => {
			mockOperation = {
				execute: jest.fn(),
			};

			mockExecuteFunctions = {
				getInputData: jest.fn(),
				getNodeParameter: jest.fn(),
				getCredentials: jest.fn(),
				getNode: jest.fn(() => ({
					id: 'test-node-id',
					name: 'Test Node',
					type: 'volcEngineTosNode',
					typeVersion: 1,
					position: [0, 0],
					parameters: {}
				})),
				continueOnFail: jest.fn(() => false),
			};

			// Reset mocks
			jest.clearAllMocks();
			
			// Setup default mocks
			const { OperationFactory } = require('../../../nodes/VolcEngineTosNode/operations/OperationFactory');
			OperationFactory.getOperation.mockReturnValue(mockOperation);
		});

		it('should be defined', () => {
			expect(node.execute).toBeDefined();
			expect(typeof node.execute).toBe('function');
		});

		it('should throw error when no credentials are provided', async () => {
			(mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue([{ json: {} }]);
			(mockExecuteFunctions.getNodeParameter as jest.Mock).mockReturnValue('checkExistence');
			(mockExecuteFunctions.getCredentials as jest.Mock).mockResolvedValue(null);

			await expect(node.execute.call(mockExecuteFunctions as IExecuteFunctions))
				.rejects.toThrow('No credentials returned!');
		});

		it('should execute operation successfully', async () => {
			const inputData = [{ json: { test: 'data' } }];
			const credentials = {
				accessKey: 'test-key',
				secretKey: 'test-secret',
				bucket: 'test-bucket',
				region: 'us-east-1',
				endpoint: 'https://tos.example.com'
			};
			const operationResult = { success: true, data: 'test-result' };

			(mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue(inputData);
			(mockExecuteFunctions.getNodeParameter as jest.Mock).mockReturnValue('checkExistence');
			(mockExecuteFunctions.getCredentials as jest.Mock).mockResolvedValue(credentials);
			mockOperation.execute.mockResolvedValue(operationResult);

			const result = await node.execute.call(mockExecuteFunctions as IExecuteFunctions);

			expect(result).toHaveLength(1);
			expect(result[0]).toHaveLength(1);
			expect(result[0][0]).toEqual({
				json: operationResult,
				pairedItem: { item: 0 }
			});
		});

		it('should process multiple input items', async () => {
			const inputData = [
				{ json: { test: 'data1' } },
				{ json: { test: 'data2' } }
			];
			const credentials = {
				accessKey: 'test-key',
				secretKey: 'test-secret',
				bucket: 'test-bucket',
				region: 'us-east-1',
				endpoint: 'https://tos.example.com'
			};

			(mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue(inputData);
			(mockExecuteFunctions.getNodeParameter as jest.Mock).mockReturnValue('checkExistence');
			(mockExecuteFunctions.getCredentials as jest.Mock).mockResolvedValue(credentials);
			mockOperation.execute.mockResolvedValueOnce({ result: 'item1' })
				.mockResolvedValueOnce({ result: 'item2' });

			const result = await node.execute.call(mockExecuteFunctions as IExecuteFunctions);

			expect(result).toHaveLength(1);
			expect(result[0]).toHaveLength(2);
			expect(result[0][0]).toEqual({
				json: { result: 'item1' },
				pairedItem: { item: 0 }
			});
			expect(result[0][1]).toEqual({
				json: { result: 'item2' },
				pairedItem: { item: 1 }
			});
		});

		it('should handle operation errors when continueOnFail is false', async () => {
			const inputData = [{ json: { test: 'data' } }];
			const credentials = {
				accessKey: 'test-key',
				secretKey: 'test-secret',
				bucket: 'test-bucket',
				region: 'us-east-1',
				endpoint: 'https://tos.example.com'
			};
			const error = new Error('Operation failed');

			(mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue(inputData);
			(mockExecuteFunctions.getNodeParameter as jest.Mock).mockReturnValue('checkExistence');
			(mockExecuteFunctions.getCredentials as jest.Mock).mockResolvedValue(credentials);
			(mockExecuteFunctions.continueOnFail as jest.Mock).mockReturnValue(false);
			mockOperation.execute.mockRejectedValue(error);

			const { TosErrorHandler } = require('../../../nodes/VolcEngineTosNode/operations/errorHandler');
			TosErrorHandler.throwNodeError.mockImplementation(() => {
				throw new NodeOperationError(mockExecuteFunctions.getNode!(), 'Mocked error');
			});

			await expect(node.execute.call(mockExecuteFunctions as IExecuteFunctions))
				.rejects.toThrow('Mocked error');

			expect(TosErrorHandler.throwNodeError).toHaveBeenCalledWith(
				mockExecuteFunctions,
				error,
				0
			);
		});

		it('should handle operation errors when continueOnFail is true', async () => {
			const inputData = [{ json: { test: 'data' } }];
			const credentials = {
				accessKey: 'test-key',
				secretKey: 'test-secret',
				bucket: 'test-bucket',
				region: 'us-east-1',
				endpoint: 'https://tos.example.com'
			};
			const error = new Error('Operation failed');
			const errorResult = { success: false, error: 'Handled error' };

			(mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue(inputData);
			(mockExecuteFunctions.getNodeParameter as jest.Mock).mockReturnValue('checkExistence');
			(mockExecuteFunctions.getCredentials as jest.Mock).mockResolvedValue(credentials);
			(mockExecuteFunctions.continueOnFail as jest.Mock).mockReturnValue(true);
			mockOperation.execute.mockRejectedValue(error);

			const { TosErrorHandler } = require('../../../nodes/VolcEngineTosNode/operations/errorHandler');
			TosErrorHandler.createContinueOnFailResult.mockReturnValue(errorResult);

			const result = await node.execute.call(mockExecuteFunctions as IExecuteFunctions);

			expect(result).toHaveLength(1);
			expect(result[0]).toHaveLength(1);
			expect(result[0][0]).toEqual({
				json: errorResult,
				pairedItem: { item: 0 }
			});

			expect(TosErrorHandler.createContinueOnFailResult).toHaveBeenCalledWith(
				error,
				'checkExistence',
				0
			);
		});

		it('should initialize TosClient with correct configuration', async () => {
			const inputData = [{ json: { test: 'data' } }];
			const credentials = {
				accessKey: 'test-access-key',
				secretKey: 'test-secret-key',
				bucket: 'test-bucket',
				region: 'cn-north-1',
				endpoint: 'https://tos-s3-cn-north-1.volces.com'
			};

			(mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue(inputData);
			(mockExecuteFunctions.getNodeParameter as jest.Mock).mockReturnValue('checkExistence');
			(mockExecuteFunctions.getCredentials as jest.Mock).mockResolvedValue(credentials);
			mockOperation.execute.mockResolvedValue({ success: true });

			await node.execute.call(mockExecuteFunctions as IExecuteFunctions);

			const { TosClient } = require('@volcengine/tos-sdk');
			expect(TosClient).toHaveBeenCalledWith({
				accessKeyId: 'test-access-key',
				accessKeySecret: 'test-secret-key',
				region: 'cn-north-1',
				endpoint: 'https://tos-s3-cn-north-1.volces.com'
			});
		});

		it('should pass correct credentials to operation executor', async () => {
			const inputData = [{ json: { test: 'data' } }];
			const credentials = {
				accessKey: 'test-access-key',
				secretKey: 'test-secret-key',
				bucket: 'test-bucket',
				region: 'cn-north-1',
				endpoint: 'https://tos-s3-cn-north-1.volces.com'
			};

			(mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue(inputData);
			(mockExecuteFunctions.getNodeParameter as jest.Mock).mockReturnValue('uploadFile');
			(mockExecuteFunctions.getCredentials as jest.Mock).mockResolvedValue(credentials);
			mockOperation.execute.mockResolvedValue({ success: true });

			await node.execute.call(mockExecuteFunctions as IExecuteFunctions);

			expect(mockOperation.execute).toHaveBeenCalledWith(
				expect.any(Object), // TosClient
				0, // itemIndex
				{
					accessKey: 'test-access-key',
					secretKey: 'test-secret-key',
					bucket: 'test-bucket',
					region: 'cn-north-1',
					endpoint: 'https://tos-s3-cn-north-1.volces.com'
				}
			);
		});
	});
});