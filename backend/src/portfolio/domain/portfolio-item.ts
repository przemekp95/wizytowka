import { randomUUID } from 'crypto';

export type PortfolioStatus = 'draft' | 'published';

export type PortfolioItem = {
  _id: string;
  title: string;
  title_en?: string;
  slug: string;
  href: string;
  desc: string;
  desc_en?: string;
  tags: string[];
  img: string;
  isLogo?: boolean;
  newTech?: boolean;
  order?: number;
  status?: PortfolioStatus;
  createdAt?: Date;
  updatedAt?: Date;
  repoUrl?: string;
};

export type CreatePortfolioItemInput = Omit<
  PortfolioItem,
  '_id' | 'createdAt' | 'updatedAt'
>;

export type UpdatePortfolioItemInput = Partial<
  Omit<PortfolioItem, '_id' | 'createdAt'>
>;

function normalizeOptionalString(
  value: string | undefined,
): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const normalized = value.trim();
  return normalized ? normalized : undefined;
}

function normalizeTags(tags: string[]): string[] {
  return tags.map((tag) => tag.trim()).filter(Boolean);
}

export class PortfolioItemAggregate {
  private constructor(private readonly props: PortfolioItem) {}

  static createNew(input: CreatePortfolioItemInput): PortfolioItemAggregate {
    const now = new Date();

    return new PortfolioItemAggregate({
      _id: randomUUID(),
      title: input.title.trim(),
      title_en: normalizeOptionalString(input.title_en),
      slug: input.slug.trim(),
      href: input.href.trim(),
      desc: input.desc.trim(),
      desc_en: normalizeOptionalString(input.desc_en),
      tags: normalizeTags(input.tags),
      img: input.img.trim(),
      isLogo: input.isLogo,
      newTech: input.newTech,
      order: input.order,
      status: input.status,
      createdAt: now,
      updatedAt: now,
      repoUrl: normalizeOptionalString(input.repoUrl),
    });
  }

  static fromPersistence(item: PortfolioItem): PortfolioItemAggregate {
    return new PortfolioItemAggregate({
      ...item,
      title: item.title.trim(),
      title_en: normalizeOptionalString(item.title_en),
      slug: item.slug.trim(),
      href: item.href.trim(),
      desc: item.desc.trim(),
      desc_en: normalizeOptionalString(item.desc_en),
      tags: normalizeTags(item.tags),
      img: item.img.trim(),
      repoUrl: normalizeOptionalString(item.repoUrl),
    });
  }

  applyUpdate(update: UpdatePortfolioItemInput): PortfolioItemAggregate {
    return new PortfolioItemAggregate({
      ...this.props,
      ...(update.title !== undefined ? { title: update.title.trim() } : {}),
      ...(update.title_en !== undefined
        ? { title_en: normalizeOptionalString(update.title_en) }
        : {}),
      ...(update.slug !== undefined ? { slug: update.slug.trim() } : {}),
      ...(update.href !== undefined ? { href: update.href.trim() } : {}),
      ...(update.desc !== undefined ? { desc: update.desc.trim() } : {}),
      ...(update.desc_en !== undefined
        ? { desc_en: normalizeOptionalString(update.desc_en) }
        : {}),
      ...(update.tags !== undefined
        ? { tags: normalizeTags(update.tags) }
        : {}),
      ...(update.img !== undefined ? { img: update.img.trim() } : {}),
      ...(update.isLogo !== undefined ? { isLogo: update.isLogo } : {}),
      ...(update.newTech !== undefined ? { newTech: update.newTech } : {}),
      ...(update.order !== undefined ? { order: update.order } : {}),
      ...(update.status !== undefined ? { status: update.status } : {}),
      ...(update.repoUrl !== undefined
        ? { repoUrl: normalizeOptionalString(update.repoUrl) }
        : {}),
      updatedAt: new Date(),
    });
  }

  get imageUrl(): string {
    return this.props.img;
  }

  toObject(): PortfolioItem {
    return {
      ...this.props,
      tags: [...this.props.tags],
    };
  }
}
