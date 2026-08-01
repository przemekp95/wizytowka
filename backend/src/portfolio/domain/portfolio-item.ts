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
  problem?: string;
  problem_en?: string;
  role?: string;
  role_en?: string;
  decisions?: string[];
  decisions_en?: string[];
  result?: string;
  result_en?: string;
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

function normalizeOptionalList(
  values: string[] | undefined,
): string[] | undefined {
  return values === undefined ? undefined : normalizeTags(values);
}

function assertPublishableCaseStudy(item: PortfolioItem): void {
  if (item.status !== 'published') {
    return;
  }

  const hasCompleteNarrative = Boolean(
    item.problem &&
    item.problem_en &&
    item.role &&
    item.role_en &&
    item.result &&
    item.result_en &&
    item.decisions &&
    item.decisions.length >= 2 &&
    item.decisions_en &&
    item.decisions_en.length === item.decisions.length,
  );
  const hasEvidence = Boolean(item.href || item.repoUrl);

  if (!hasCompleteNarrative || item.tags.length === 0 || !hasEvidence) {
    throw new Error(
      'Published portfolio items require complete case-study fields, a stack, and at least one evidence URL.',
    );
  }
}

export class PortfolioItemAggregate {
  private constructor(private readonly props: PortfolioItem) {}

  static createNew(input: CreatePortfolioItemInput): PortfolioItemAggregate {
    const now = new Date();
    const item: PortfolioItem = {
      _id: randomUUID(),
      title: input.title.trim(),
      title_en: normalizeOptionalString(input.title_en),
      slug: input.slug.trim(),
      href: input.href.trim(),
      desc: input.desc.trim(),
      desc_en: normalizeOptionalString(input.desc_en),
      problem: normalizeOptionalString(input.problem),
      problem_en: normalizeOptionalString(input.problem_en),
      role: normalizeOptionalString(input.role),
      role_en: normalizeOptionalString(input.role_en),
      decisions: normalizeOptionalList(input.decisions),
      decisions_en: normalizeOptionalList(input.decisions_en),
      result: normalizeOptionalString(input.result),
      result_en: normalizeOptionalString(input.result_en),
      tags: normalizeTags(input.tags),
      img: input.img.trim(),
      isLogo: input.isLogo,
      newTech: input.newTech,
      order: input.order,
      status: input.status,
      createdAt: now,
      updatedAt: now,
      repoUrl: normalizeOptionalString(input.repoUrl),
    };

    assertPublishableCaseStudy(item);
    return new PortfolioItemAggregate(item);
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
      problem: normalizeOptionalString(item.problem),
      problem_en: normalizeOptionalString(item.problem_en),
      role: normalizeOptionalString(item.role),
      role_en: normalizeOptionalString(item.role_en),
      decisions: normalizeOptionalList(item.decisions),
      decisions_en: normalizeOptionalList(item.decisions_en),
      result: normalizeOptionalString(item.result),
      result_en: normalizeOptionalString(item.result_en),
      tags: normalizeTags(item.tags),
      img: item.img.trim(),
      repoUrl: normalizeOptionalString(item.repoUrl),
    });
  }

  applyUpdate(update: UpdatePortfolioItemInput): PortfolioItemAggregate {
    const item: PortfolioItem = {
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
      ...(update.problem !== undefined
        ? { problem: normalizeOptionalString(update.problem) }
        : {}),
      ...(update.problem_en !== undefined
        ? { problem_en: normalizeOptionalString(update.problem_en) }
        : {}),
      ...(update.role !== undefined
        ? { role: normalizeOptionalString(update.role) }
        : {}),
      ...(update.role_en !== undefined
        ? { role_en: normalizeOptionalString(update.role_en) }
        : {}),
      ...(update.decisions !== undefined
        ? { decisions: normalizeOptionalList(update.decisions) }
        : {}),
      ...(update.decisions_en !== undefined
        ? { decisions_en: normalizeOptionalList(update.decisions_en) }
        : {}),
      ...(update.result !== undefined
        ? { result: normalizeOptionalString(update.result) }
        : {}),
      ...(update.result_en !== undefined
        ? { result_en: normalizeOptionalString(update.result_en) }
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
    };

    assertPublishableCaseStudy(item);
    return new PortfolioItemAggregate(item);
  }

  get imageUrl(): string {
    return this.props.img;
  }

  toObject(): PortfolioItem {
    return {
      ...this.props,
      tags: [...this.props.tags],
      decisions: this.props.decisions ? [...this.props.decisions] : undefined,
      decisions_en: this.props.decisions_en
        ? [...this.props.decisions_en]
        : undefined,
    };
  }
}
