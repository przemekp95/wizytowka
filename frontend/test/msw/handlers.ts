import { graphql } from 'msw';

export const handlers = [
  graphql.mutation('createMessage', (req, res, ctx) => {
    return res(
      ctx.data({
        createMessage: {
          id: '1',
          name: req.variables.input.name,
          email: req.variables.input.email,
          content: req.variables.input.content,
        },
      })
    );
  }),
];
