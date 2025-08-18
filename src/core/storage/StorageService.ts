import type { Project } from '../../shared/models/project';

export class StorageService {
  async saveProject(project: Project): Promise<void> {
    // Placeholder implementation - will use IndexedDB for local, Supabase for cloud
    localStorage.setItem(`project_${project.projectId}`, JSON.stringify(project));
  }

  async loadProject(projectId: string): Promise<Project | null> {
    // Placeholder implementation
    const data = localStorage.getItem(`project_${projectId}`);
    return data ? JSON.parse(data) : null;
  }

  async listProjects(): Promise<Project[]> {
    // Placeholder implementation
    const projects: Project[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('project_')) {
        const data = localStorage.getItem(key);
        if (data) {
          projects.push(JSON.parse(data));
        }
      }
    }
    return projects;
  }

  async deleteProject(projectId: string): Promise<void> {
    localStorage.removeItem(`project_${projectId}`);
  }
}

// Create and export singleton instance
export const storageService = new StorageService();