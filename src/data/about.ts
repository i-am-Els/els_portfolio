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
      title: "Gameplay Systems (C++ / UE5)",
      description: "Building core mechanics, input, shader and material logic and interaction logic in engine."
    },
    {
      icon: "paint-brush",
      title: "Visual Storytelling",
      description: "Bridging the gap between art and technology all towards impactful and performant storytelling experiences."
    },
    {
      icon: "command-line",
      title: "Procedural System",
      description: "Designing dynamic, reusable setups for modelling and layout tasks."
    }
  ]
} as const;

export type AboutContent = typeof aboutContent;
