export const PORTFOLIO_IMAGE_STORAGE = Symbol('PORTFOLIO_IMAGE_STORAGE');

export type PortfolioImageFile = {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
};

export type PortfolioImageStoragePort = {
  uploadImage(file: PortfolioImageFile): Promise<string>;
  deleteImage(imageUrl: string): Promise<void>;
};
