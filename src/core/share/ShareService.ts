import type { Project } from '../../shared/models/project';

export interface ShareLink {
  id: string;
  url: string;
  projectId: string;
  createdAt: number;
}

export class ShareService {
  async createShareLink(project: Project): Promise<ShareLink> {
    // Placeholder implementation
    const shareId = Math.random().toString(36).substring(7);
    return {
      id: shareId,
      url: `${window.location.origin}/share/${shareId}`,
      projectId: project.projectId,
      createdAt: Date.now()
    };
  }

  async getSharedProject(shareId: string): Promise<Project | null> {
    // Placeholder implementation
    throw new Error('Share service not implemented yet');
  }
}

// Create and export singleton instance
export const shareService = new ShareService();