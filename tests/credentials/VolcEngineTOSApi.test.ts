import { VolcEngineTOSApi } from '../../credentials/VolcEngineTOSApi.credentials';

describe('VolcEngineTOSApi Credentials', () => {
	let credentials: VolcEngineTOSApi;

	beforeEach(() => {
		credentials = new VolcEngineTOSApi();
	});

	describe('Credential Properties', () => {
		it('should have correct name', () => {
			expect(credentials.name).toBe('volcEngineTOSApi');
		});

		it('should have correct display name', () => {
			expect(credentials.displayName).toBe('VolcEngine TOS API Credentials API');
		});

		it('should have documentation URL', () => {
			expect(credentials.documentationUrl).toBeDefined();
			expect(credentials.documentationUrl).toContain('bytedance.net');
		});

		it('should have required properties', () => {
			expect(credentials.properties).toBeDefined();
			expect(Array.isArray(credentials.properties)).toBe(true);
			expect(credentials.properties.length).toBeGreaterThan(0);
		});
	});

	describe('Access Key Property', () => {
		it('should have accessKey property', () => {
			const accessKeyProp = credentials.properties.find(
				(prop: any) => prop.name === 'accessKey'
			);
			expect(accessKeyProp).toBeDefined();
			expect(accessKeyProp!.displayName).toBe('Access Key');
			expect(accessKeyProp!.type).toBe('string');
			expect(accessKeyProp!.required).toBe(true);
		});
	});

	describe('Secret Key Property', () => {
		it('should have secretKey property', () => {
			const secretKeyProp = credentials.properties.find(
				(prop: any) => prop.name === 'secretKey'
			);
			expect(secretKeyProp).toBeDefined();
			expect(secretKeyProp!.displayName).toBe('Secret Key');
			expect(secretKeyProp!.type).toBe('string');
			expect(secretKeyProp!.required).toBe(true);
		});

		it('should have password type option for secretKey', () => {
			const secretKeyProp = credentials.properties.find(
				(prop: any) => prop.name === 'secretKey'
			);
			expect(secretKeyProp).toBeDefined();
			expect(secretKeyProp!.typeOptions).toBeDefined();
			expect((secretKeyProp as any).typeOptions.password).toBe(true);
		});
	});

	describe('Bucket Property', () => {
		it('should have bucket property', () => {
			const bucketProp = credentials.properties.find(
				(prop: any) => prop.name === 'bucket'
			);
			expect(bucketProp).toBeDefined();
			expect(bucketProp!.displayName).toBe('Bucket Name');
			expect(bucketProp!.type).toBe('string');
			expect(bucketProp!.required).toBe(true);
		});
	});

	describe('Region Property', () => {
		it('should have region property', () => {
			const regionProp = credentials.properties.find(
				(prop: any) => prop.name === 'region'
			);
			expect(regionProp).toBeDefined();
			expect(regionProp!.displayName).toBe('Region');
			expect(regionProp!.type).toBe('string');
			expect(regionProp!.required).toBe(true);
			expect(regionProp!.default).toBe('cn-north-1');
		});
	});

	describe('Endpoint Property', () => {
		it('should have endpoint property', () => {
			const endpointProp = credentials.properties.find(
				(prop: any) => prop.name === 'endpoint'
			);
			expect(endpointProp).toBeDefined();
			expect(endpointProp!.displayName).toBe('Endpoint');
			expect(endpointProp!.type).toBe('string');
			expect(endpointProp!.required).toBe(false);
		});
	});
});