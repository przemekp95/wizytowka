import { PortfolioItem } from '../../domain/portfolio-item';

export const PORTFOLIO_REPOSITORY = Symbol('PORTFOLIO_REPOSITORY');

export type PortfolioDependencyStatus = {
  name: 'mongo';
  ready: boolean;
  error?: string;
};

export type PortfolioRepositoryPort = {
  listPublished(): Promise<PortfolioItem[]>;
  findById(id: string): Promise<PortfolioItem | null>;
  create(item: PortfolioItem): Promise<PortfolioItem>;
  update(item: PortfolioItem): Promise<PortfolioItem | null>;
  deleteById(id: string): Promise<boolean>;
  getDependencyStatus(): Promise<PortfolioDependencyStatus>;
};
