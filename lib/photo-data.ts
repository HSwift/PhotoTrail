export interface PhotoData {
  id: string;
  title: string;
  caption: string;
  thumbnail: string;
  preview: string;
  fullSize: string;
  aspectRatio: number;
  location: {
    lat: number;
    lng: number
    name: string;
  };
  metadata: {
    camera: string;
    lens: string;
    focal: string;
    iso: number;
    aperture: string;
    shutterSpeed: string;
  };
  tags: string[];
  dateTaken: string;
}

export interface ProjectData {
  name: string;
  title: string;
  description: string;
  base_url: string;
  photos: PhotoData[];
}

const STORAGE_BASE = process.env.STORAGE_BASE;

export async function loadProjectData(project: string): Promise<ProjectData> {
  const url = `${STORAGE_BASE!.replace(/\/$/, '')}/${project}.json`;

  try {
    const response = await fetch(url, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`Failed to load project data: ${response.statusText}`);
    }

    const data = await response.json();
    return data as ProjectData;
  } catch (error) {
    console.error(`Error loading project data for ${project}:`, error);
    throw error;
  }
}

export function processPhotoUrl(project: ProjectData) {
  console.log(project)
  const base_url = project.base_url.replace(/\/$/, '');
  for (const photo of project.photos) {
      photo.preview = `${base_url}/${photo.preview}`;
      photo.fullSize = `${base_url}/${photo.fullSize}`;
  }
}