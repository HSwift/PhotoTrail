"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Calendar, Camera, MapPin, X } from "lucide-react";
import type { PhotoData } from "@/lib/photo-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PhotoViewerProps {
  photo: PhotoData | null;
  onClose: () => void;
}

export function PhotoViewer({ photo, onClose }: PhotoViewerProps) {
  if (!photo) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="flex relative max-w-full max-h-full bg-white overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-10 bg-black/20 hover:bg-black/40 text-white"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>

          <div className="flex flex-col lg:flex-row">
            <div className="flex-1">
              <img
                src={photo.fullSize || "/placeholder.svg"}
                alt={photo.title}
                className="w-full h-auto max-h-[95vh] object-contain"
              />
            </div>

            <div className="lg:w-80 p-6 bg-white overflow-y-auto">
              <h2 className="text-2xl font-bold mb-2">{photo.title}</h2>
              <p className="text-muted-foreground mb-4">{photo.caption}</p>

              <div className="space-y-3 text-sm font-mono">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{photo.location.name}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-muted-foreground" />
                  <span>{photo.metadata.camera}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>
                    {new Date(photo.dateTaken).toLocaleString("zh-cn")}
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="font-semibold mb-2">Camera Settings</h4>
                <div className="grid grid-cols-1 gap-2 text-sm font-mono">
                  <div>
                    <span className="text-muted-foreground">Lens: </span>
                    {photo.metadata.lens}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Focal: </span>
                    {photo.metadata.focal}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Aperture: </span>
                    {photo.metadata.aperture}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Shutter: </span>
                    {photo.metadata.shutterSpeed}
                  </div>
                  <div>
                    <span className="text-muted-foreground">ISO: </span>
                    {photo.metadata.iso}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="font-semibold mb-2">Tags</h4>
                <div className="flex flex-wrap gap-1">
                  {photo.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
