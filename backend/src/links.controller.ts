import { Controller, Get, Param, Res } from '@nestjs/common';
import {
  ApiFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { LinkDto } from './links.openapi.dto';

type Link = { slug: string; title: string; url: string };

const LINKS: Link[] = [
  { slug: 'github', title: 'GitHub', url: 'https://github.com/przemekp95' },
  {
    slug: 'linkedin',
    title: 'LinkedIn',
    url: 'https://www.linkedin.com/in/przempietrzak/',
  },
];

@ApiTags('links')
@Controller('links')
export class LinksController {
  @Get()
  @ApiOperation({
    summary: 'List configured external links',
  })
  @ApiOkResponse({ type: LinkDto, isArray: true })
  all() {
    return LINKS;
  }

  @Get('r/:slug')
  @ApiOperation({
    summary: 'Redirect to an external link by slug',
  })
  @ApiParam({
    name: 'slug',
    example: 'github',
  })
  @ApiFoundResponse({
    description: 'Redirects to the configured target URL or / when missing',
  })
  redirect(@Param('slug') slug: string, @Res() res: Response) {
    const found = LINKS.find((l) => l.slug === slug);
    if (!found) return res.redirect(302, '/');
    return res.redirect(302, found.url);
  }
}
