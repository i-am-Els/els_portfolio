export interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  image: string;
  tags: string[];
  date: string;
  readTime: string;
}

export const blogPosts: BlogPost[] = [
  {
    id: 1,
    title: "Getting Started with Unreal Engine 5",
    excerpt: "A comprehensive guide for beginners looking to start their journey in Unreal Engine 5 development.",
    image: "/blog/ue5-start.jpg",
    tags: ["Unreal Engine", "Game Development", "Beginner", "Tutorial"],
    date: "2024-03-15",
    readTime: "10 min read"
  },
  {
    id: 2,
    title: "Technical Art Pipeline Optimization",
    excerpt: "Learn how to optimize your technical art pipeline for better efficiency and productivity.",
    image: "/blog/tech-art.jpg",
    tags: ["Technical Art", "Pipeline", "Optimization", "Workflow"],
    date: "2024-03-10",
    readTime: "15 min read"
  },
  {
    id: 3,
    title: "Advanced Shader Development in UE5",
    excerpt: "Deep dive into advanced shader development techniques for Unreal Engine 5.",
    image: "/blog/shaders.jpg",
    tags: ["Unreal Engine", "Shader Development", "HLSL", "Advanced"],
    date: "2024-03-05",
    readTime: "20 min read"
  },
  {
    id: 4,
    title: "Game Performance Optimization Techniques",
    excerpt: "Essential techniques for optimizing game performance across different platforms.",
    image: "/blog/procedural-env.jpg",
    tags: ["Performance", "Optimization", "Game Development", "Technical"],
    date: "2024-02-28",
    readTime: "12 min read"
  },
  {
    id: 5,
    title: "Creating Custom Tools for Game Development",
    excerpt: "A guide to developing custom tools that enhance your game development workflow.",
    image: "/blog/shade.jpg",
    tags: ["Tool Development", "Python", "Automation", "Workflow"],
    date: "2024-02-20",
    readTime: "18 min read"
  },
  {
    id: 6,
    title: "Mastering Material Creation in UE5",
    excerpt: "Learn how to create complex and realistic materials in Unreal Engine 5.",
    image: "/blog/materials.jpg",
    tags: ["Unreal Engine", "Materials", "Shader Graph", "Tutorial"],
    date: "2024-02-15",
    readTime: "15 min read"
  }
]; 