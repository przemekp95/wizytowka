import { Injectable } from '@nestjs/common';
import { AwsService } from '../../aws/aws.service';
import type {
  PortfolioImageFile,
  PortfolioImageStoragePort,
} from '../application/ports/portfolio-image-storage.port';

@Injectable()
export class S3PortfolioImageStorageAdapter implements PortfolioImageStoragePort {
  constructor(private readonly awsService: AwsService) {}

  async uploadImage(file: PortfolioImageFile): Promise<string> {
    return this.awsService.uploadImage(file, 'portfolio');
  }

  async deleteImage(imageUrl: string): Promise<void> {
    await this.awsService.deleteImage(imageUrl);
  }
}
