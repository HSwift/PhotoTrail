import { PhotoGallery } from "@/components/photo-gallery";
import { photoData } from "@/lib/photo-data";

export default function Home() {
  return <PhotoGallery photos={photoData} />;
}
