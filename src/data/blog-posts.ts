export type BlogPost = {
  id: number;
  title: string;
  excerpt: string;
  image: string;
  tags: string[];
  date: string;
  readTime: string;
};

export const blogPosts: BlogPost[] = [
  {
    id: 1,
    title: "Getting Started with Unreal Engine 5",
    excerpt: "A comprehensive guide to setting up your first project in UE5, covering essential tools, interface navigation, and basic project setup.",
    image: "/blog/ue5-start.jpg",
    tags: ["Unreal Engine", "Game Development", "Tutorial", "Learning"],
    date: "2024-03-15",
    readTime: "10 min read"
  },
  {
    id: 2,
    title: "Technical Art Pipeline Optimization",
    excerpt: "Learn how to streamline your technical art workflow between Blender and Unreal Engine, focusing on efficient asset creation and implementation.",
    image: "/blog/tech-art.jpg",
    tags: ["Technical Art", "Blender", "Unreal Engine", "Workflow"],
    date: "2024-03-01",
    readTime: "15 min read"
  },
  {
    id: 3,
    title: "Advanced Shader Development in UE5",
    excerpt: "Deep dive into creating custom shaders in Unreal Engine 5, covering material functions, custom expressions, and performance optimization.",
    image: "/blog/shaders.jpg",
    tags: ["Shaders", "Technical Art", "Unreal Engine", "HLSL"],
    date: "2024-02-15",
    readTime: "20 min read"
  },
  {
    id: 4,
    title: "Character Animation Best Practices",
    excerpt: "Essential techniques for creating smooth and efficient character animations, from rigging to implementation in game engines.",
    image: "/blog/character-anim.jpg",
    tags: ["Animation", "Technical Art", "Blender", "Game Development"],
    date: "2024-02-01",
    readTime: "12 min read"
  },
  {
    id: 5,
    title: "Procedural Content Generation Guide",
    excerpt: "Master the art of procedural content generation in UE5, from basic setups to advanced techniques for creating dynamic game worlds.",
    image: "/blog/procedural-env.jpg",
    tags: ["Procedural Generation", "Technical Art", "Unreal Engine", "Game Development"],
    date: "2024-01-15",
    readTime: "18 min read"
  },
  {
    id: 6,
    title: "3D Asset Optimization Techniques",
    excerpt: "Learn how to optimize your 3D assets for real-time rendering, covering LODs, texture optimization, and performance considerations.",
    image: "/blog/shade.jpg",
    tags: ["3D Modeling", "Technical Art", "Performance", "Game Development"],
    date: "2024-01-01",
    readTime: "14 min read"
  },
  {
    id: 7,
    title: "Game Development Fundamentals",
    excerpt: "A beginner-friendly guide to game development concepts, tools, and best practices for aspiring game developers.",
    image: "/blog/game-dev.jpg",
    tags: ["Game Development", "Tutorial", "Learning", "Unreal Engine"],
    date: "2023-12-15",
    readTime: "8 min read"
  },
  {
    id: 8,
    title: "Creating Custom Game Mechanics",
    excerpt: "Step-by-step guide to implementing custom game mechanics in Unreal Engine, from concept to polished implementation.",
    image: "/blog/game-mechanics.jpg",
    tags: ["Game Development", "Unreal Engine", "C++", "Blueprint"],
    date: "2023-12-01",
    readTime: "16 min read"
  },
  {
    id: 9,
    title: "Advanced Material Creation in UE5",
    excerpt: "Explore advanced material creation techniques in Unreal Engine 5, including layered materials, dynamic effects, and performance optimization.",
    image: "/blog/materials.jpg",
    tags: ["Technical Art", "Unreal Engine", "Materials", "Shaders"],
    date: "2023-11-15",
    readTime: "22 min read"
  },
  {
    id: 10,
    title: "Blender to UE5 Workflow Guide",
    excerpt: "Complete guide to optimizing your Blender to Unreal Engine workflow, covering modeling, UV mapping, and asset export best practices.",
    image: "/blog/blender-ue5.jpg",
    tags: ["Blender", "Technical Art", "Unreal Engine", "Workflow"],
    date: "2023-11-01",
    readTime: "15 min read"
  },
  {
    id: 11,
    title: "Game Performance Optimization",
    excerpt: "Learn essential techniques for optimizing game performance in Unreal Engine, from asset management to code optimization.",
    image: "/blog/performance.jpg",
    tags: ["Game Development", "Performance", "Unreal Engine", "Technical Art"],
    date: "2023-10-15",
    readTime: "17 min read"
  },
  {
    id: 12,
    title: "Advanced Blueprint Programming",
    excerpt: "Master Blueprint visual scripting in Unreal Engine with advanced techniques, best practices, and optimization strategies.",
    image: "/blog/blueprint.jpg",
    tags: ["Game Development", "Unreal Engine", "Blueprint", "Tutorial"],
    date: "2023-10-01",
    readTime: "13 min read"
  }
]; 