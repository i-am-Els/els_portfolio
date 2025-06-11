export type Project = {
  id: number;
  title: string;
  description: string;
  image: string;
  tags: string[];
  demoUrl?: string;
  githubUrl?: string;
  date: string;
};

export const projects: Project[] = [
  {
    id: 1,
    title: "Advanced Shader Collection",
    description: "A comprehensive collection of custom shaders for game development, including water, fire, and environmental effects. Built with HLSL and Unreal Engine.",
    image: "/projects/shader-dev.jpg",
    tags: ["Shaders", "Technical Art", "Unreal Engine", "HLSL"],
    demoUrl: "https://example.com/demo1",
    githubUrl: "https://github.com/example/proj1",
    date: "2024-03"
  },
  {
    id: 2,
    title: "Procedural Environment Generator",
    description: "A UE5 tool for generating procedural environments using PCG framework. Features include terrain generation, vegetation placement, and dynamic weather systems.",
    image: "/projects/procedural-env.jpg",
    tags: ["Unreal Engine", "Technical Art", "C++", "Procedural Generation"],
    demoUrl: "https://example.com/demo2",
    githubUrl: "https://github.com/example/proj2",
    date: "2024-02"
  },
  {
    id: 3,
    title: "Character Animation Pipeline",
    description: "An automated character animation pipeline using Blender and Unreal Engine. Includes rigging, animation, and real-time preview tools.",
    image: "/projects/character-modeling.jpg",
    tags: ["Blender", "Animation", "Technical Art", "Unreal Engine"],
    demoUrl: "https://example.com/demo3",
    githubUrl: "https://github.com/example/proj3",
    date: "2024-01"
  },
  {
    id: 4,
    title: "Game Development Tutorial Series",
    description: "A comprehensive tutorial series covering game development fundamentals, from basic concepts to advanced techniques in Unreal Engine.",
    image: "/projects/shader-tutorials.jpg",
    tags: ["Tutorial", "Game Development", "Unreal Engine", "Learning"],
    demoUrl: "https://example.com/demo4",
    githubUrl: "https://github.com/example/proj4",
    date: "2023-12"
  },
  {
    id: 5,
    title: "3D Asset Creation Workflow",
    description: "An optimized workflow for creating and implementing 3D assets in game engines, focusing on performance and quality.",
    image: "/projects/tech-docs.jpg",
    tags: ["3D Modeling", "Technical Art", "Blender", "Game Development"],
    demoUrl: "https://example.com/demo5",
    githubUrl: "https://github.com/example/proj5",
    date: "2023-11"
  },
  {
    id: 6,
    title: "Game Mechanics Framework",
    description: "A modular framework for implementing common game mechanics in Unreal Engine, including combat, inventory, and AI systems.",
    image: "/projects/performance.jpg",
    tags: ["Game Development", "C++", "Unreal Engine", "Blueprint"],
    demoUrl: "https://example.com/demo6",
    githubUrl: "https://github.com/example/proj6",
    date: "2023-10"
  },
  {
    id: 7,
    title: "Advanced Material System",
    description: "A sophisticated material system for Unreal Engine that enables dynamic material changes and complex visual effects.",
    image: "/projects/shader-dev.jpg",
    tags: ["Technical Art", "Unreal Engine", "Materials", "HLSL"],
    demoUrl: "https://example.com/demo7",
    githubUrl: "https://github.com/example/proj7",
    date: "2023-09"
  },
  {
    id: 8,
    title: "Procedural Animation Tool",
    description: "A tool for creating procedural animations in Unreal Engine, focusing on natural movement and dynamic interactions.",
    image: "/projects/character-modeling.jpg",
    tags: ["Animation", "Technical Art", "Unreal Engine", "C++"],
    demoUrl: "https://example.com/demo8",
    githubUrl: "https://github.com/example/proj8",
    date: "2023-08"
  },
  {
    id: 9,
    title: "Game Performance Analyzer",
    description: "A comprehensive tool for analyzing and optimizing game performance in Unreal Engine projects.",
    image: "/projects/performance.jpg",
    tags: ["Performance", "Technical Art", "Unreal Engine", "C++"],
    demoUrl: "https://example.com/demo9",
    githubUrl: "https://github.com/example/proj9",
    date: "2023-07"
  },
  {
    id: 10,
    title: "Advanced Blueprint System",
    description: "A collection of reusable Blueprint systems for rapid game development in Unreal Engine.",
    image: "/projects/tech-docs.jpg",
    tags: ["Game Development", "Unreal Engine", "Blueprint", "Tutorial"],
    demoUrl: "https://example.com/demo10",
    githubUrl: "https://github.com/example/proj10",
    date: "2023-06"
  },
  {
    id: 11,
    title: "Shader Graph Library",
    description: "A library of custom shader graphs for common visual effects in Unreal Engine.",
    image: "/projects/shader-dev.jpg",
    tags: ["Shaders", "Technical Art", "Unreal Engine", "Materials"],
    demoUrl: "https://example.com/demo11",
    githubUrl: "https://github.com/example/proj11",
    date: "2023-05"
  },
  {
    id: 12,
    title: "Character Customization System",
    description: "A flexible system for character customization in Unreal Engine games.",
    image: "/projects/character-modeling.jpg",
    tags: ["Technical Art", "Unreal Engine", "Character", "C++"],
    demoUrl: "https://example.com/demo12",
    githubUrl: "https://github.com/example/proj12",
    date: "2023-04"
  }
]; 