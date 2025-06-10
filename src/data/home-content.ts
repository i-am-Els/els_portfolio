import { blogPosts } from './blog-posts';
import { projects } from './projects';

// Get only the 3 most recent blog posts for home page
export const recentBlogPosts = blogPosts.slice(0, 3);

// Get only the 3 most recent projects for home page
export const recentProjects = projects.slice(0, 3); 