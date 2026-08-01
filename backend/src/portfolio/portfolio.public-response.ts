import type {
  PortfolioDeleteResponseDto,
  PortfolioItemDto,
  PortfolioListResponseDto,
  PortfolioMutationResponseDto,
} from './dto/portfolio-rest.dto';
import type { PortfolioItem } from './portfolio.service';

export function toPublicPortfolioItem(item: PortfolioItem): PortfolioItemDto {
  return {
    _id: item._id,
    title: item.title,
    title_en: item.title_en,
    slug: item.slug,
    href: item.href,
    desc: item.desc,
    desc_en: item.desc_en,
    problem: item.problem,
    problem_en: item.problem_en,
    role: item.role,
    role_en: item.role_en,
    decisions: item.decisions ? [...item.decisions] : undefined,
    decisions_en: item.decisions_en ? [...item.decisions_en] : undefined,
    result: item.result,
    result_en: item.result_en,
    tags: [...item.tags],
    img: item.img,
    isLogo: item.isLogo,
    newTech: item.newTech,
    order: item.order,
    status: item.status,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    repoUrl: item.repoUrl,
  };
}

export function toPublicPortfolioListResponse(
  items: PortfolioItem[],
): PortfolioListResponseDto {
  return {
    ok: true,
    items: items.map(toPublicPortfolioItem),
  };
}

export function toPublicPortfolioMutationResponse(
  item: PortfolioItem,
): PortfolioMutationResponseDto {
  return {
    ok: true,
    item: toPublicPortfolioItem(item),
  };
}

export function toPublicPortfolioDeleteResponse(): PortfolioDeleteResponseDto {
  return {
    ok: true,
    deleted: true,
  };
}
