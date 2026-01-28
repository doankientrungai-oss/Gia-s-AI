
export enum Role {
  USER = 'user',
  MODEL = 'model',
}

export interface TextPart {
  text: string;
}

export interface ImagePart {
  inlineData: {
    data: string;
    mimeType: string;
  };
}

export type ContentPart = TextPart | ImagePart;

export interface Message {
  role: Role;
  parts: ContentPart[];
}
