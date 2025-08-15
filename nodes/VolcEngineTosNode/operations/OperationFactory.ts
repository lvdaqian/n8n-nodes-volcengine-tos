import { IOperationExecutor } from './types';
import { HeadObjectOperation } from './HeadObjectOperation';
import { PutObjectOperation } from './PutObjectOperation';
import { GetObjectOperation } from './GetObjectOperation';
import { DeleteObjectOperation } from './DeleteObjectOperation';
import { ListObjectsOperation } from './ListObjectsOperation';
import { CopyObjectOperation } from './CopyObjectOperation';
import { CreateBucketOperation } from './CreateBucketOperation';
import { DeleteBucketOperation } from './DeleteBucketOperation';
import { ListBucketsOperation } from './ListBucketsOperation';

/**
 * 操作工厂类
 * 负责创建和管理所有TOS操作实例
 */
export class OperationFactory {
	private static operations: Map<string, IOperationExecutor> = new Map();

	static {
		// 注册所有操作
		this.operations.set('checkExistence', new HeadObjectOperation());
		this.operations.set('uploadFile', new PutObjectOperation());
		this.operations.set('downloadFile', new GetObjectOperation());
		this.operations.set('deleteFile', new DeleteObjectOperation());
		this.operations.set('listFiles', new ListObjectsOperation());
		this.operations.set('copyFile', new CopyObjectOperation());
		this.operations.set('createBucket', new CreateBucketOperation());
		this.operations.set('deleteBucket', new DeleteBucketOperation());
		this.operations.set('listBuckets', new ListBucketsOperation());
	}

	/**
	 * 获取操作实例
	 * @param operationType 操作类型
	 * @returns 操作实例
	 */
	static getOperation(operationType: string): IOperationExecutor {
		const operation = this.operations.get(operationType);
		if (!operation) {
			throw new Error(`不支持的操作类型: ${operationType}`);
		}
		return operation;
	}

	/**
	 * 获取所有支持的操作类型
	 * @returns 操作类型数组
	 */
	static getSupportedOperations(): string[] {
		return Array.from(this.operations.keys());
	}

	/**
	 * 检查是否支持指定操作
	 * @param operationType 操作类型
	 * @returns 是否支持
	 */
	static isSupported(operationType: string): boolean {
		return this.operations.has(operationType);
	}
}