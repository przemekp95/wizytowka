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
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  constructor(private readonly configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get('aws.region'),
      credentials: {
        accessKeyId: this.configService.get('aws.accessKeyId')!,
        secretAccessKey: this.configService.get('aws.secretAccessKey')!,
      },
    });
    this.bucketName = this.configService.get('aws.s3.bucketName')!;
  }

  async uploadImage(
    file: MulterFile,
    folder: string = 'portfolio',
  ): Promise<string> {
    const fileExtension = path.extname(file.originalname);
    const fileName = `${folder}/${uuidv4()}${fileExtension}`;

    try {
      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.bucketName,
          Key: fileName,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: 'public-read',
        },
      });

      await upload.done();
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
      await this.s3Client.send(
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
