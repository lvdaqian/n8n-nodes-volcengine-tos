import { BaseOperation } from '../../../../nodes/VolcEngineTosNode/operations/BaseOperation';
import { TosClient } from '@volcengine/tos-sdk';
import { IExecuteFunctions } from 'n8n-workflow';

// Mock TOS SDK
jest.mock('@volcengine/tos-sdk');

// 创建一个具体的测试实现类
class TestOperation extends BaseOperation {
	constructor() {
		super('testOperation');
	}

	async execute(
		this: IExecuteFunctions,
		client: TosClient,
		itemIndex: number,
		credentials: {
			accessKey: string;
			secretKey: string;
			bucket: string;
			region: string;
			endpoint: string;
		}
	): Promise<any> {
		return { success: true, test: 'data' };
	}

	// 公开受保护的方法用于测试
	public testValidateRequiredParams(params: Record<string, any>, required: string[]) {
		return this.validateRequiredParams(params, required);
	}

	public testGetCommonParams(executeFunctions: IExecuteFunctions, itemIndex: number) {
		return this.getCommonParams(executeFunctions, itemIndex);
	}

	public testGenerateFileUrl(bucket: string, region: string, filePath: string) {
		return this.generateFileUrl(bucket, region, filePath);
	}
}

describe('BaseOperation', () => {
	let mockExecuteFunctions: Partial<IExecuteFunctions>;
	let mockTosClient: jest.Mocked<TosClient>;
	let testOperation: TestOperation;

	beforeEach(() => {
		// Mock IExecuteFunctions
		mockExecuteFunctions = {
			getCredentials: jest.fn().mockResolvedValue({
				accessKey: 'test-access-key',
				secretKey: 'test-secret-key',
				region: 'cn-north-1',
				endpoint: 'https://tos-s3-cn-north-1.volces.com'
			}),
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
			headObject: jest.fn(),
			putObject: jest.fn(),
			getObject: jest.fn(),
			deleteObject: jest.fn(),
			listObjects: jest.fn(),
			copyObject: jest.fn(),
			createBucket: jest.fn(),
			deleteBucket: jest.fn(),
			listBuckets: jest.fn()
		} as any;

		(TosClient as jest.MockedClass<typeof TosClient>).mockImplementation(() => mockTosClient);

		testOperation = new TestOperation();
	});

	describe('Constructor', () => {
		it('should initialize with operation name', () => {
			// 测试构造函数是否正确初始化
			expect(testOperation).toBeInstanceOf(BaseOperation);
			expect(testOperation).toBeInstanceOf(TestOperation);
			expect(testOperation['operationName']).toBe('testOperation');
		});
	});

	describe('safeExecute', () => {
		it('should execute operation and return result', async () => {
			const credentials = {
				accessKey: 'test-access-key',
				secretKey: 'test-secret-key',
				bucket: 'test-bucket',
				region: 'cn-north-1',
				endpoint: 'https://tos-s3-cn-north-1.volces.com'
			};

			const result = await testOperation.safeExecute(
				mockExecuteFunctions as IExecuteFunctions,
				mockTosClient,
				0,
				credentials
			);

			expect(result).toEqual({
				success: true,
				data: { success: true, test: 'data' }
			});
		});

		it('should handle errors and return error result', async () => {
			// 创建一个会抛出错误的测试操作
			class ErrorTestOperation extends BaseOperation {
				constructor() {
					super('errorTestOperation');
				}

				async execute(): Promise<any> {
					throw new Error('Test error');
				}
			}

			const errorOperation = new ErrorTestOperation();
			const credentials = {
				accessKey: 'test-access-key',
				secretKey: 'test-secret-key',
				bucket: 'test-bucket',
				region: 'cn-north-1',
				endpoint: 'https://tos-s3-cn-north-1.volces.com'
			};

			const result = await errorOperation.safeExecute(
				mockExecuteFunctions as IExecuteFunctions,
				mockTosClient,
				0,
				credentials
			);

			expect(result.success).toBe(false);
			expect(result.error).toContain('Test error');
		});
	});

	describe('getCommonParams', () => {
		it('should get common parameters', () => {
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('test-file-path')
				.mockReturnValueOnce('test-bucket');

			const result = testOperation.testGetCommonParams(mockExecuteFunctions as IExecuteFunctions, 0);

			expect(result).toEqual({
				filePath: 'test-file-path',
				bucket: 'test-bucket'
			});
		});
	});

	describe('validateRequiredParams', () => {
		it('should not throw error when all required params are provided', () => {
			const params = { bucket: 'test-bucket', key: 'test-key' };
			const required = ['bucket', 'key'];

			expect(() => testOperation.testValidateRequiredParams(params, required)).not.toThrow();
		});

		it('should throw error when required param is missing', () => {
			const params = { bucket: 'test-bucket' };
			const required = ['bucket', 'key'];

			expect(() => testOperation.testValidateRequiredParams(params, required))
				.toThrow('缺少必需参数: key');
		});

		it('should throw error when required param is empty string', () => {
			const params = { bucket: 'test-bucket', key: '' };
			const required = ['bucket', 'key'];

			expect(() => testOperation.testValidateRequiredParams(params, required))
				.toThrow('缺少必需参数: key');
		});

		it('should throw error for multiple missing params', () => {
			const params = {};
			const required = ['bucket', 'key'];

			expect(() => testOperation.testValidateRequiredParams(params, required))
				.toThrow('缺少必需参数: bucket');
		});
	});

	describe('generateFileUrl', () => {
		it('should generate correct file URL', () => {
			const url = testOperation.testGenerateFileUrl('test-bucket', 'cn-north-1', 'test/file.txt');

			expect(url).toBe('https://test-bucket.cn-north-1.tos-cn-cn-north-1.bytedance.net/test/file.txt');
		});
	});
});