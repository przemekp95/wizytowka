import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';

type Link = { slug: string; title: string; url: string };

const LINKS: Link[] = [
  { slug: 'github', title: 'GitHub', url: 'https://github.com/TwojNick' },
  {
    slug: 'linkedin',
    title: 'LinkedIn',
    url: 'https://www.linkedin.com/in/TwojProfil',
  },
];

@Controller('links')
export class LinksController {
  @Get()
  all() {
    return LINKS;
  }

  // redirect: /api/links/r/:slug  → 302
  @Get('r/:slug')
  redirect(@Param('slug') slug: string, @Res() res: Response) {
    const found = LINKS.find((l) => l.slug === slug);
    if (!found) return res.redirect(302, '/'); // albo 404
    return res.redirect(302, found.url);
  }
}
