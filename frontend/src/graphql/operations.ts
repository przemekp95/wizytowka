import { gql } from '@apollo/client';

export const ProjectsQuery = gql`
  query Projects {
    projects {
      id
      title
      description
      link
      repo
      tags
    }
  }
`;

export const CreateProjectMutation = gql`
  mutation CreateProject($input: CreateProjectInput!) {
    createProject(input: $input) {
      id
      title
    }
  }
`;
