import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

interface MulterFile {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
}

@Injectable()
export class AwsService {
  private readonly logger = new Logger(AwsService.name);
  private s3Client: S3Client | null = null;
  private readonly bucketName: string;

  constructor(private readonly configService: ConfigService) {
    this.bucketName = this.configService.get('aws.s3.bucketName')!;
  }

  private getS3Client(): S3Client {
    if (!this.s3Client) {
      this.logger.log('🔧 Initializing AWS S3 client...');
      this.s3Client = new S3Client({
        region: this.configService.get('aws.region'),
        credentials: {
          accessKeyId: this.configService.get('aws.accessKeyId')!,
          secretAccessKey: this.configService.get('aws.secretAccessKey')!,
        },
      });
      this.logger.log('✅ AWS S3 client initialized');
    }
    return this.s3Client;
  }

  async uploadImage(
    file: MulterFile,
    folder: string = 'portfolio',
  ): Promise<string> {
    const fileExtension = path.extname(file.originalname);
    const fileName = `${folder}/${uuidv4()}${fileExtension}`;

    try {
      this.logger.log(
        `Starting upload: ${fileName} (${file.buffer.length} bytes)`,
      );

      const upload = new Upload({
        client: this.getS3Client(),
        params: {
          Bucket: this.bucketName,
          Key: fileName,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: 'public-read',
        },
      });

      // Add timeout to prevent hanging
      const uploadPromise = upload.done();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Upload timeout after 30s')), 30000),
      );

      await Promise.race([uploadPromise, timeoutPromise]);
      this.logger.log(`Image uploaded successfully: ${fileName}`);
      return `https://${this.bucketName}.s3.amazonaws.com/${fileName}`;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : '';
      this.logger.error(`Error uploading image: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  async deleteImage(imageUrl: string): Promise<void> {
    try {
      const key = imageUrl.split('/').slice(-2).join('/');
      await this.getS3Client().send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );
      this.logger.log(`Image deleted successfully: ${key}`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : '';
      this.logger.error(`Error deleting image: ${errorMessage}`, errorStack);
      throw error;
    }
  }
}
