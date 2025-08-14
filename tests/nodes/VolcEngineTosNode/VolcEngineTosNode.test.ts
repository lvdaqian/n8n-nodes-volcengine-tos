import { VolcEngineTosNode } from '../../../nodes/VolcEngineTosNode/VolcEngineTosNode.node';

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
		it('should be defined', () => {
			expect(node.execute).toBeDefined();
			expect(typeof node.execute).toBe('function');
		});

		// Note: More detailed execution tests would require mocking the TOS SDK responses
		// and testing the actual business logic, which can be added as needed
	});
});