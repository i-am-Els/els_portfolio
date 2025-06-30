type IconType = 'code-bracket' | 'paint-brush' | 'cube' | 'command-line';

type Skill = {
  icon: IconType;
  title: string;
  description: string;
};

export const aboutContent = {
  summary: "I work at the crossroads of gameplay and art—where mechanics meet motion. Whether building systems or shaping shaders, I’m learning fast and building with intention. Every line of code and pixel I place moves me closer to the world I imagine.",
  skills: [
    {
      icon: "code-bracket",
      title: "Gameplay Systems (C++ / UE5)",
      description: "Building core mechanics, input, and interaction logic in engine."
    },
    {
      icon: "paint-brush",
      title: "Shader Programming",
      description: "Creating stylised, optimised visuals using node-based and code-driven approaches."
    },
    {
      icon: "cube",
      title: "Procedural System",
      description: "Designing dynamic, reusable setups for modelling and layout tasks."
    },
    {
      icon: "command-line",
      title: "Tool Development",
      description: "Creating scripts and utilities that streamline creative workflows."
    }
  ]
} as const;

export type AboutContent = typeof aboutContent;
