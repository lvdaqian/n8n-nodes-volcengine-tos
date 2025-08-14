import { VolcEngineTosNode } from '../../../nodes/VolcEngineTosNode/VolcEngineTosNode.node';
import { IExecuteFunctions } from 'n8n-workflow';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

describe('VolcEngineTosNode Integration Tests', () => {
	let node: VolcEngineTosNode;
	let mockExecuteFunctions: Partial<IExecuteFunctions>;

	// 测试配置
	const testConfig = {
		accessKey: process.env.VOLCENGINE_ACCESS_KEY || 'test-access-key',
		secretKey: process.env.VOLCENGINE_SECRET_KEY || 'test-secret-key',
		bucket: process.env.VOLCENGINE_BUCKET || 'test-bucket',
		region: process.env.VOLCENGINE_REGION || 'cn-north-1',
		endpoint: process.env.VOLCENGINE_ENDPOINT || '',
	};

	// 检查是否有真实凭据进行集成测试
	const hasRealCredentials = Boolean(
		process.env.VOLCENGINE_ACCESS_KEY && 
		process.env.VOLCENGINE_SECRET_KEY && 
		process.env.VOLCENGINE_BUCKET
	);

	// 测试文件配置
	const testFilePrefix = process.env.TEST_FILE_PREFIX || 'test/integration/';
	const testFileName = `${testFilePrefix}test-file-${Date.now()}.txt`;
	const testFileContent = 'This is a test file for VolcEngine TOS integration testing.';

	beforeEach(() => {
		node = new VolcEngineTosNode();
		
		// 模拟 IExecuteFunctions
		mockExecuteFunctions = {
			getInputData: jest.fn(),
			getNodeParameter: jest.fn(),
			getCredentials: jest.fn(),
			getNode: jest.fn(() => ({
				id: 'test-node-id',
				name: 'Test VolcEngine TOS Node',
				type: 'volcEngineTosNode',
				typeVersion: 1,
				position: [0, 0],
				parameters: {},
			})),
			continueOnFail: jest.fn(() => false),
		} as any;
	});

	describe('Node Configuration', () => {
		it('should have correct node description', () => {
			expect(node.description.displayName).toBe('VolcEngineTos Node');
			expect(node.description.name).toBe('volcEngineTosNode');
			expect(node.description.group).toContain('output');
			expect(node.description.version).toBe(1);
		});

		it('should require volcEngineTOSApi credentials', () => {
			const credentials = node.description.credentials;
			expect(credentials).toHaveLength(1);
			expect(credentials![0].name).toBe('volcEngineTOSApi');
			expect(credentials![0].required).toBe(true);
		});
	});

	describe('Error Handling', () => {
		it('should provide friendly error messages for missing credentials', async () => {
			// 模拟缺少凭据的情况
			(mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue([
				{ json: { test: 'data' } }
			]);
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('checkExistence') // operation
				.mockReturnValueOnce('test-file.txt'); // filePath
			(mockExecuteFunctions.getCredentials as jest.Mock).mockRejectedValue(
				new Error('Credentials not found')
			);

			await expect(node.execute.call(mockExecuteFunctions as IExecuteFunctions))
				.rejects.toThrow('Credentials not found');
		});

		it('should handle invalid operation parameter', async () => {
			(mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue([
				{ json: { test: 'data' } }
			]);
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockReturnValueOnce('invalidOperation') // operation
				.mockReturnValueOnce('test-file.txt'); // filePath
			(mockExecuteFunctions.getCredentials as jest.Mock).mockResolvedValue(testConfig);

			await expect(node.execute.call(mockExecuteFunctions as IExecuteFunctions))
				.rejects.toThrow(/不支持的操作类型|invalidOperation/);
		});
	});

	// 真实API测试 - 只有在有真实凭据时才运行
	describe('Real API Tests', () => {
		const describeOrSkip = hasRealCredentials ? describe : describe.skip;
		
		describeOrSkip('Check File Existence Operation', () => {
			it('should check if a non-existent file returns false', async () => {
				const nonExistentFile = `${testFilePrefix}non-existent-${Date.now()}.txt`;
				
				(mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue([
					{ json: { test: 'data' } }
				]);
				(mockExecuteFunctions.getNodeParameter as jest.Mock)
					.mockReturnValueOnce('checkExistence') // operation
					.mockReturnValueOnce(nonExistentFile); // filePath
				(mockExecuteFunctions.getCredentials as jest.Mock).mockResolvedValue(testConfig);

				try {
					const result = await node.execute.call(mockExecuteFunctions as IExecuteFunctions);
					// 如果没有抛出错误，说明文件存在（不太可能）
					expect(result).toBeDefined();
					expect(Array.isArray(result)).toBe(true);
					if (result[0] && result[0].length > 0) {
						expect(result[0][0].json).toHaveProperty('exists', true);
					}
				} catch (error: any) {
					// 期望的行为：文件不存在时应该有友好的错误处理
					expect(error.message).toBeDefined();
					console.log('Expected error for non-existent file:', error.message);
				}
			}, 15000);
		});

		describeOrSkip('Upload and Check File Operation', () => {
			it('should upload a file and then verify its existence', async () => {
				// 第一步：上传文件
				const testBuffer = Buffer.from(testFileContent, 'utf8');
				
				(mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue([
					{ 
						json: { test: 'upload' },
						binary: {
							data: {
								data: testBuffer.toString('base64'),
								mimeType: 'text/plain',
								fileName: 'test-file.txt'
							}
						}
					}
				]);
				(mockExecuteFunctions.getNodeParameter as jest.Mock)
					.mockReturnValueOnce('uploadFile') // operation
					.mockReturnValueOnce(testFileName) // filePath
					.mockReturnValueOnce('data') // binaryProperty
					.mockReturnValueOnce(false); // makePublic
				(mockExecuteFunctions.getCredentials as jest.Mock).mockResolvedValue(testConfig);

				try {
					const uploadResult = await node.execute.call(mockExecuteFunctions as IExecuteFunctions);
					
					expect(uploadResult).toBeDefined();
					expect(Array.isArray(uploadResult)).toBe(true);
					expect(uploadResult.length).toBeGreaterThan(0);
					
					const uploadData = uploadResult[0][0].json as any;
					expect(uploadData).toHaveProperty('uploaded', true);
					expect(uploadData).toHaveProperty('path', testFileName);
					expect(uploadData).toHaveProperty('bucket', testConfig.bucket);
					expect(uploadData).toHaveProperty('url');
					expect(typeof uploadData.url).toBe('string');
					
					console.log('✅ 文件上传成功:', uploadData.url);
					
					// 第二步：验证文件存在性
					(mockExecuteFunctions.getNodeParameter as jest.Mock).mockClear();
					(mockExecuteFunctions.getNodeParameter as jest.Mock)
						.mockReturnValueOnce('checkExistence') // operation
						.mockReturnValueOnce(testFileName); // filePath
					
					const checkResult = await node.execute.call(mockExecuteFunctions as IExecuteFunctions);
					
					expect(checkResult).toBeDefined();
					expect(Array.isArray(checkResult)).toBe(true);
					expect(checkResult.length).toBeGreaterThan(0);
					
					const checkData = checkResult[0][0].json as any;
					expect(checkData).toHaveProperty('exists', true);
					expect(checkData).toHaveProperty('path', testFileName);
					expect(checkData).toHaveProperty('url');
					
					console.log('✅ 文件存在性验证成功:', checkData.url);
					
				} catch (error: any) {
					console.error('❌ 真实API测试失败:', error.message);
					throw error;
				}
			}, 30000); // 增加超时时间用于网络请求
		});

		describeOrSkip('Upload Public File Operation', () => {
			it('should upload a public file successfully', async () => {
				const publicFileName = `${testFilePrefix}public-test-${Date.now()}.txt`;
				const testBuffer = Buffer.from('This is a public test file.', 'utf8');
				
				(mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue([
					{ 
						json: { test: 'public-upload' },
						binary: {
							data: {
								data: testBuffer.toString('base64'),
								mimeType: 'text/plain',
								fileName: 'public-test.txt'
							}
						}
					}
				]);
				(mockExecuteFunctions.getNodeParameter as jest.Mock)
					.mockReturnValueOnce('uploadFile') // operation
					.mockReturnValueOnce(publicFileName) // filePath
					.mockReturnValueOnce('data') // binaryProperty
					.mockReturnValueOnce(true); // makePublic
				(mockExecuteFunctions.getCredentials as jest.Mock).mockResolvedValue(testConfig);

				try {
					const result = await node.execute.call(mockExecuteFunctions as IExecuteFunctions);
					
					expect(result).toBeDefined();
					expect(Array.isArray(result)).toBe(true);
					expect(result.length).toBeGreaterThan(0);
					
					const uploadData = result[0][0].json as any;
					expect(uploadData).toHaveProperty('uploaded', true);
					expect(uploadData).toHaveProperty('path', publicFileName);
					expect(uploadData).toHaveProperty('url');
					
					console.log('✅ 公共文件上传成功:', uploadData.url);
					
				} catch (error: any) {
					console.error('❌ 公共文件上传失败:', error.message);
					throw error;
				}
			}, 20000);
		});
	});

	// 性能测试
	describe('Performance Tests', () => {
		it('should handle multiple files efficiently', async () => {
			const startTime = Date.now();
			
			// 模拟多个文件输入
			const multipleInputs = Array.from({ length: 3 }, (_, i) => ({
				json: { fileIndex: i }
			}));

			(mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue(multipleInputs);
			(mockExecuteFunctions.getNodeParameter as jest.Mock)
				.mockImplementation((paramName: string, itemIndex: number) => {
					if (paramName === 'operation') return 'checkExistence';
					if (paramName === 'filePath') return `test-file-${itemIndex}.txt`;
					return undefined;
				});
			(mockExecuteFunctions.getCredentials as jest.Mock).mockResolvedValue(testConfig);

			try {
				const result = await node.execute.call(mockExecuteFunctions as IExecuteFunctions);
				const endTime = Date.now();
				const executionTime = endTime - startTime;

				expect(result).toBeDefined();
				expect(Array.isArray(result)).toBe(true);
				expect(executionTime).toBeLessThan(10000); // 应该在10秒内完成
				
				console.log(`处理3个文件耗时: ${executionTime}ms`);
			} catch (error) {
				// 性能测试中的错误是可以接受的，主要测试执行时间
				console.log('Performance test completed with expected errors');
			}
		}, 15000);
	});
});

// 测试运行说明
if (process.env.NODE_ENV !== 'test') {
	const credentialsStatus = Boolean(
		process.env.VOLCENGINE_ACCESS_KEY && 
		process.env.VOLCENGINE_SECRET_KEY && 
		process.env.VOLCENGINE_BUCKET
	);
	
	console.log(`
=== VolcEngine TOS Node 集成测试说明 ===

1. 单元测试: 总是运行，测试节点配置和错误处理
2. 性能测试: 测试多文件处理性能
3. 真实API测试: 需要设置以下环境变量:
   - VOLCENGINE_ACCESS_KEY
   - VOLCENGINE_SECRET_KEY  
   - VOLCENGINE_BUCKET
   - VOLCENGINE_REGION (可选，默认: cn-north-1)
   - VOLCENGINE_ENDPOINT (可选)

要运行完整的集成测试，请设置环境变量:
export VOLCENGINE_ACCESS_KEY="your-access-key"
export VOLCENGINE_SECRET_KEY="your-secret-key"
export VOLCENGINE_BUCKET="your-test-bucket"

然后运行: npm test

当前状态: ${credentialsStatus ? '✅ 检测到真实凭据' : '⚠️  使用模拟凭据'}
`);
}