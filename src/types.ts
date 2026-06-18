export type Theme = {
  id: string;
  name: string;
  file: string;
  preview: string | null;
  isDark: boolean;
  tags: string[];
  colors: Record<string, string>;
  sourcePath: string;
  sourcePreviewPath: string | null;
};

export type Manifest = {
  updatedAt: string;
  source: string;
  themes: Theme[];
};
