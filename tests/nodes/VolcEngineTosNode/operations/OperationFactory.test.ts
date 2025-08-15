import { OperationFactory } from '../../../../nodes/VolcEngineTosNode/operations/OperationFactory';
import { HeadObjectOperation } from '../../../../nodes/VolcEngineTosNode/operations/HeadObjectOperation';
import { PutObjectOperation } from '../../../../nodes/VolcEngineTosNode/operations/PutObjectOperation';
import { GetObjectOperation } from '../../../../nodes/VolcEngineTosNode/operations/GetObjectOperation';
import { DeleteObjectOperation } from '../../../../nodes/VolcEngineTosNode/operations/DeleteObjectOperation';
import { ListObjectsOperation } from '../../../../nodes/VolcEngineTosNode/operations/ListObjectsOperation';
import { CopyObjectOperation } from '../../../../nodes/VolcEngineTosNode/operations/CopyObjectOperation';
import { CreateBucketOperation } from '../../../../nodes/VolcEngineTosNode/operations/CreateBucketOperation';
import { DeleteBucketOperation } from '../../../../nodes/VolcEngineTosNode/operations/DeleteBucketOperation';
import { ListBucketsOperation } from '../../../../nodes/VolcEngineTosNode/operations/ListBucketsOperation';

describe('OperationFactory', () => {
	describe('getOperation', () => {
		it('should return HeadObjectOperation for checkExistence', () => {
			const operation = OperationFactory.getOperation('checkExistence');
			expect(operation).toBeInstanceOf(HeadObjectOperation);
		});

		it('should return PutObjectOperation for uploadFile', () => {
			const operation = OperationFactory.getOperation('uploadFile');
			expect(operation).toBeInstanceOf(PutObjectOperation);
		});

		it('should return GetObjectOperation for downloadFile', () => {
			const operation = OperationFactory.getOperation('downloadFile');
			expect(operation).toBeInstanceOf(GetObjectOperation);
		});

		it('should return DeleteObjectOperation for deleteFile', () => {
			const operation = OperationFactory.getOperation('deleteFile');
			expect(operation).toBeInstanceOf(DeleteObjectOperation);
		});

		it('should return ListObjectsOperation for listFiles', () => {
			const operation = OperationFactory.getOperation('listFiles');
			expect(operation).toBeInstanceOf(ListObjectsOperation);
		});

		it('should return CopyObjectOperation for copyFile', () => {
			const operation = OperationFactory.getOperation('copyFile');
			expect(operation).toBeInstanceOf(CopyObjectOperation);
		});

		it('should return CreateBucketOperation for createBucket', () => {
			const operation = OperationFactory.getOperation('createBucket');
			expect(operation).toBeInstanceOf(CreateBucketOperation);
		});

		it('should return DeleteBucketOperation for deleteBucket', () => {
			const operation = OperationFactory.getOperation('deleteBucket');
			expect(operation).toBeInstanceOf(DeleteBucketOperation);
		});

		it('should return ListBucketsOperation for listBuckets', () => {
			const operation = OperationFactory.getOperation('listBuckets');
			expect(operation).toBeInstanceOf(ListBucketsOperation);
		});

		it('should throw error for unsupported operation type', () => {
			expect(() => {
				OperationFactory.getOperation('unsupportedOperation');
			}).toThrow('不支持的操作类型: unsupportedOperation');
		});

		it('should throw error for empty operation type', () => {
			expect(() => {
				OperationFactory.getOperation('');
			}).toThrow('不支持的操作类型: ');
		});

		it('should throw error for null operation type', () => {
			expect(() => {
				OperationFactory.getOperation(null as any);
			}).toThrow('不支持的操作类型: null');
		});
	});

	describe('getSupportedOperations', () => {
		it('should return all supported operation types', () => {
			const supportedOperations = OperationFactory.getSupportedOperations();
			const expectedOperations = [
				'checkExistence',
				'uploadFile',
				'downloadFile',
				'deleteFile',
				'listFiles',
				'copyFile',
				'createBucket',
				'deleteBucket',
				'listBuckets',
				'getPreSignedUrl'
			];

			expect(supportedOperations).toHaveLength(expectedOperations.length);
			expectedOperations.forEach(operation => {
				expect(supportedOperations).toContain(operation);
			});
		});

		it('should return array of strings', () => {
			const supportedOperations = OperationFactory.getSupportedOperations();
			expect(Array.isArray(supportedOperations)).toBe(true);
			supportedOperations.forEach(operation => {
				expect(typeof operation).toBe('string');
			});
		});
	});

	describe('isSupported', () => {
		it('should return true for supported operations', () => {
			const supportedOperations = [
				'checkExistence',
				'uploadFile',
				'downloadFile',
				'deleteFile',
				'listFiles',
				'copyFile',
				'createBucket',
				'deleteBucket',
				'listBuckets'
			];

			supportedOperations.forEach(operation => {
				expect(OperationFactory.isSupported(operation)).toBe(true);
			});
		});

		it('should return false for unsupported operations', () => {
			const unsupportedOperations = [
				'unsupportedOperation',
				'invalidOperation',
				'',
				'null',
				'undefined'
			];

			unsupportedOperations.forEach(operation => {
				expect(OperationFactory.isSupported(operation)).toBe(false);
			});
		});

		it('should return false for null and undefined', () => {
			expect(OperationFactory.isSupported(null as any)).toBe(false);
			expect(OperationFactory.isSupported(undefined as any)).toBe(false);
		});

		it('should be case sensitive', () => {
			expect(OperationFactory.isSupported('CheckExistence')).toBe(false);
			expect(OperationFactory.isSupported('UPLOADFILE')).toBe(false);
			expect(OperationFactory.isSupported('downloadfile')).toBe(false);
		});
	});

	describe('static initialization', () => {
		it('should have all operations registered after class loading', () => {
			const supportedOperations = OperationFactory.getSupportedOperations();
			expect(supportedOperations.length).toBeGreaterThan(0);
			
			// 验证每个操作都能正确获取
			supportedOperations.forEach(operation => {
				expect(() => OperationFactory.getOperation(operation)).not.toThrow();
			});
		});
	});
});