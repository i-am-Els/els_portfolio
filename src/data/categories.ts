export type Category = {
  id: string;
  name: string;
};

export const categories: Category[] = [
  { id: 'all', name: 'All' },
  { id: 'game-dev', name: 'Game Development' },
  { id: 'tech-art', name: 'Technical Art' },
  { id: 'tutorials', name: 'Tutorials' },
];

// Category tag mappings for filtering
export const categoryTagMap: { [key: string]: string[] } = {
  'game-dev': ['unreal', 'unity', 'game', 'development', 'c++', 'blueprint', 'gameplay', 'ue5', 'unreal engine'],
  'tech-art': ['blender', 'shader', 'technical', 'art', 'digital art', '3d', 'modeling', 'texture', 'animation', 'hlsl'],
  'tutorials': ['tutorial', 'guide', 'learning', 'how-to', 'documentation', 'beginner', 'advanced']
}; 