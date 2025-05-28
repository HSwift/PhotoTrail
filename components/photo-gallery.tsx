"use client";

import { useMemo, useState } from "react";
import { PhotoCard } from "./photo-card";
import { PhotoViewer } from "./photo-viewer";
import { PhotoMap } from "./photo-map";
import { useScrollSpy } from "@/hooks/use-scroll-spy";
import { useIsMobile } from "@/hooks/use-mobile";
import type { PhotoData } from "@/lib/photo-data";

interface PhotoGalleryProps {
  photos: PhotoData[];
}

export function PhotoGallery({ photos }: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoData | null>(null);
  const photoIds = useMemo(() => photos.map((photo) => `photo-${photo.id}`), [
    photos,
  ]);
  const {activeId: activePhotoId, nodeCallback} = useScrollSpy(photoIds);
  const isMobile = useIsMobile();

  const currentPhotoIndex = useMemo(() => {
    if (!activePhotoId) return 0;
    return photos.findIndex((photo) => `photo-${photo.id}` === activePhotoId);
  }, [activePhotoId, photos]);

  // Distribute photos across columns for masonry effect
  const distributePhotos = (photos: PhotoData[], columnCount: number) => {
    const columns: PhotoData[][] = Array.from(
      { length: columnCount },
      () => [],
    );

    photos.forEach((photo, index) => {
      const columnIndex = index % columnCount;
      columns[columnIndex].push(photo);
    });

    return columns;
  };

  const mobileColumns = distributePhotos(photos, 1);

  if (isMobile) {
    return (
      <div className="bg-gray-50">
        {/* Mobile Layout: Vertical Stack */}
        <div className="h-screen flex flex-col">
          {/* Map Section - Top on Mobile */}
          <div className="h-[30vh] z-10 shrink-0">
            <PhotoMap
              photos={photos}
              currentPhotoIndex={Math.max(0, currentPhotoIndex)}
            />
          </div>

          {/* Photo Feed - Bottom on Mobile */}
          <div ref={nodeCallback} id="photo-feed" className="flex-1 p-4 overflow-y-scroll">
            <div>
              <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Photo Journey</h1>
                <p className="text-muted-foreground text-sm">
                  A collection of moments captured around the world
                </p>
              </div>

              {/* Mobile: 1 column */}
              <div className="space-y-4">
                {mobileColumns[0]?.map((photo, index) => (
                  <div key={photo.id} id={`photo-${photo.id}`}>
                    <PhotoCard
                      photo={photo}
                      onClick={() =>
                        setSelectedPhoto(photo)}
                      isInView={currentPhotoIndex === photos.findIndex((p) =>
                        p.id === photo.id
                      )}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Photo Viewer */}
        <PhotoViewer
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 max-lg:hidden">
      {/* Desktop Layout: Side by Side */}
      <div className="flex h-screen">
        {/* Photo Feed - Left on Desktop */}
        <div ref={nodeCallback} id="photo-feed" className="flex-1 overflow-y-auto">
          <div className="p-6 lg:mx-16">
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-2">Photo Journey</h1>
              <p className="text-muted-foreground">
                A collection of moments captured around the world
              </p>
            </div>

            <div className="bloc">
              <div className="space-y-6">
                {mobileColumns[0]?.map((photo, index) => (
                  <div key={photo.id} id={`photo-${photo.id}`}>
                    <PhotoCard
                      photo={photo}
                      onClick={() =>
                        setSelectedPhoto(photo)}
                      isInView={currentPhotoIndex === photos.findIndex((p) =>
                        p.id === photo.id
                      )}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="w-2/5 h-full sticky top-0">
          <PhotoMap
            photos={photos}
            currentPhotoIndex={Math.max(0, currentPhotoIndex)}
          />
        </div>
      </div>
      {/* Photo Viewer */}
      <PhotoViewer
        photo={selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
      />
    </div>
  );
}
