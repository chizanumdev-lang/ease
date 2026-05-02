import { gql } from '@apollo/client/core';

export const GET_CATEGORIES = gql`
  query GetCategories {
    getCategories {
      id
      name
      slug
      icon
    }
  }
`;

export const GET_TASK_DEFINITIONS = gql`
  query GetTaskDefinitions {
    getTaskDefinitions {
      id
      capability
      name
      description
      defaultConfig
    }
  }
`;

export const SAVE_BLUEPRINT = gql`
  mutation SaveBlueprint($templateId: String!, $nodes: [NodeInput!]!, $edges: [EdgeInput!]!) {
    saveBlueprint(templateId: $templateId, nodes: $nodes, edges: $edges) {
      id
      title
    }
  }
`;
