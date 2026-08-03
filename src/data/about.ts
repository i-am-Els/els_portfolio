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
      icon: "cube",
      title: "3D Modelling",
      description: "Creating 3D environments, props, characters and other assets in several DCC tools. "
    },
    {
      icon: "code-bracket",
      title: "Game Engine Integrations (Unity / Unreal Engine)",
      description: "Building optimised assets, textures and resources that integrate well into game engine pipelines."
    },
    {
      icon: "paint-brush",
      title: "Visual Storytelling",
      description: "Bridging the gap between art and technology all towards impactful and performant storytelling experiences."
    },
    {
      icon: "command-line",
      title: "Procedural System",
      description: "Designing dynamic, reusable setups for modelling and layout tasks using art and programming tools alike."
    }
  ]
} as const;

export type AboutContent = typeof aboutContent;
