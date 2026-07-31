import { LinksController } from './links.controller';

describe('LinksController', () => {
  it('returns the verified public GitHub and LinkedIn profiles', () => {
    expect(new LinksController().all()).toEqual([
      {
        slug: 'github',
        title: 'GitHub',
        url: 'https://github.com/przemekp95',
      },
      {
        slug: 'linkedin',
        title: 'LinkedIn',
        url: 'https://www.linkedin.com/in/przempietrzak/',
      },
    ]);
  });
});
