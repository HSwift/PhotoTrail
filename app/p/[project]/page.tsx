import { PhotoGallery } from "@/components/photo-gallery";
import { loadProjectData, processPhotoUrl } from "@/lib/photo-data";

interface PageProps {
  params: Promise<{ project: string }>;
}

export default async function ProjectPage({ params }: PageProps) {
  const { project } = await params;


  try {
    const projectData = await loadProjectData(project);
    processPhotoUrl(projectData);
    return <PhotoGallery project={projectData} />;
  } catch (error) {
    console.error("Failed to load project data:", error);
    // You could return an error component here
  }
}