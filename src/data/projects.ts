export interface Project {
  id: number;
  title: string;
  description: string;
  image: string;
  tags: string[];
  demoUrl?: string;
  githubUrl?: string;
}

export const projects: Project[] = [
  {
    id: 1,
    title: "Unreal Engine Shader Development",
    description: "Advanced shader development for realistic material rendering in Unreal Engine 5.",
    image: "/projects/shader-dev.jpg",
    tags: ["Unreal Engine", "HLSL", "Shader Development", "Technical Art"],
    demoUrl: "https://example.com/demo",
    githubUrl: "https://github.com/eniolaolawale/shader-dev"
  },
  {
    id: 2,
    title: "Game Development Pipeline Tools",
    description: "Custom tools and automation scripts for game development workflow optimization.",
    image: "/projects/pipeline-tools.jpg",
    tags: ["Python", "Tool Development", "Automation", "Game Development"],
    githubUrl: "https://github.com/eniolaolawale/pipeline-tools"
  },
  {
    id: 3,
    title: "3D Character Modeling",
    description: "High-quality character modeling and texturing for game development.",
    image: "/projects/character-modeling.jpg",
    tags: ["Blender", "3D Modeling", "Texturing", "Character Art"],
    demoUrl: "https://artstation.com/artwork/example"
  },
  {
    id: 4,
    title: "Technical Art Documentation",
    description: "Comprehensive documentation and tutorials for technical art workflows.",
    image: "/projects/tech-docs.jpg",
    tags: ["Documentation", "Tutorials", "Technical Art", "Education"],
    demoUrl: "https://example.com/docs"
  },
  {
    id: 5,
    title: "Game Performance Optimization",
    description: "Performance optimization techniques for game development.",
    image: "/projects/performance.jpg",
    tags: ["Performance", "Optimization", "Game Development", "Technical Art"],
    githubUrl: "https://github.com/eniolaolawale/performance-tools"
  },
  {
    id: 6,
    title: "Shader Graph Tutorials",
    description: "Tutorial series on creating complex materials using Unreal Engine's Shader Graph.",
    image: "/projects/shader-tutorials.jpg",
    tags: ["Tutorials", "Shader Graph", "Unreal Engine", "Education"],
    demoUrl: "https://example.com/tutorials"
  }
]; 