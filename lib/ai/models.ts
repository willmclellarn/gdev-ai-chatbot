export const DEFAULT_CHAT_MODEL: string = 'chat-model';

export interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export interface EmbeddingModel {
  id: string;
  name: string;
  description: string;
  dimensions: number;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'chat-model',
    name: 'Chat model',
    description: 'Primary model for all-purpose chat',
  },
  {
    id: 'chat-model-reasoning',
    name: 'Reasoning model',
    description: 'Uses advanced reasoning',
  },
];

export const embeddingModels: Array<EmbeddingModel> = [
  {
    id: 'text-embedding-3-small',
    name: 'text-embedding-3-small',
    description: 'Small, fast embedding model with good performance',
    dimensions: 1536,
  },
  {
    id: 'text-embedding-3-large',
    name: 'text-embedding-3-large',
    description: 'Large embedding model with best performance',
    dimensions: 3072,
  },
];
