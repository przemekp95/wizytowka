import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  PORTFOLIO_IMAGE_STORAGE,
  type PortfolioImageFile,
  type PortfolioImageStoragePort,
} from './application/ports/portfolio-image-storage.port';
import {
  PORTFOLIO_REPOSITORY,
  type PortfolioDependencyStatus,
  type PortfolioRepositoryPort,
} from './application/ports/portfolio-repository.port';
import {
  PortfolioItemAggregate,
  type CreatePortfolioItemInput,
  type PortfolioItem,
  type UpdatePortfolioItemInput,
} from './domain/portfolio-item';

@Injectable()
export class PortfolioService {
  private readonly logger = new Logger(PortfolioService.name);

  constructor(
    @Inject(PORTFOLIO_REPOSITORY)
    private readonly repository: PortfolioRepositoryPort,
    @Inject(PORTFOLIO_IMAGE_STORAGE)
    private readonly imageStorage: PortfolioImageStoragePort,
  ) {}

  async getDependencyStatus(): Promise<PortfolioDependencyStatus> {
    return this.repository.getDependencyStatus();
  }

  async listPublished(): Promise<PortfolioItem[]> {
    return this.repository.listPublished();
  }

  async createPortfolioItem(
    itemData: CreatePortfolioItemInput,
    imageFile?: PortfolioImageFile,
  ): Promise<PortfolioItem> {
    let uploadedImageUrl: string | undefined;

    try {
      if (imageFile) {
        uploadedImageUrl = await this.imageStorage.uploadImage(imageFile);
      }

      const item = PortfolioItemAggregate.createNew({
        ...itemData,
        img: uploadedImageUrl ?? itemData.img,
      }).toObject();

      return await this.repository.create(item);
    } catch (error) {
      if (uploadedImageUrl) {
        await this.deleteImageBestEffort(
          uploadedImageUrl,
          `rolled back failed create for portfolio slug ${itemData.slug}`,
        );
      }

      throw error;
    }
  }

  async updatePortfolioItem(
    id: string,
    updateData: UpdatePortfolioItemInput,
    imageFile?: PortfolioImageFile,
  ): Promise<PortfolioItem | null> {
    const existingItem = await this.repository.findById(id);

    if (!existingItem) {
      return null;
    }

    let uploadedImageUrl: string | undefined;

    try {
      if (imageFile) {
        uploadedImageUrl = await this.imageStorage.uploadImage(imageFile);
      }

      const updatedItem = PortfolioItemAggregate.fromPersistence(
        existingItem,
      ).applyUpdate({
        ...updateData,
        ...(uploadedImageUrl ? { img: uploadedImageUrl } : {}),
      });

      const savedItem = await this.repository.update(updatedItem.toObject());

      if (!savedItem && uploadedImageUrl) {
        await this.deleteImageBestEffort(
          uploadedImageUrl,
          `rolled back failed update for portfolio item ${id}`,
        );
      }

      if (
        savedItem &&
        uploadedImageUrl &&
        existingItem.img &&
        existingItem.img !== uploadedImageUrl
      ) {
        await this.deleteImageBestEffort(
          existingItem.img,
          `removing replaced image for portfolio item ${id}`,
        );
      }

      return savedItem;
    } catch (error) {
      if (uploadedImageUrl) {
        await this.deleteImageBestEffort(
          uploadedImageUrl,
          `rolled back failed DB update for portfolio item ${id}`,
        );
      }

      throw error;
    }
  }

  async deletePortfolioItem(id: string): Promise<boolean> {
    const item = await this.repository.findById(id);

    if (!item) {
      return false;
    }

    const deleted = await this.repository.deleteById(id);

    if (!deleted) {
      return false;
    }

    if (item.img) {
      await this.deleteImageBestEffort(
        item.img,
        `deleting image for removed portfolio item ${id}`,
      );
    }

    return true;
  }

  private async deleteImageBestEffort(
    imageUrl: string,
    reason: string,
  ): Promise<void> {
    try {
      await this.imageStorage.deleteImage(imageUrl);
    } catch (error) {
      this.logger.warn(
        `Image cleanup skipped for ${reason}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}

export type {
  CreatePortfolioItemInput,
  PortfolioItem,
  PortfolioStatus,
  UpdatePortfolioItemInput,
} from './domain/portfolio-item';
