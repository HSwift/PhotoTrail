"use client";

import { motion } from "framer-motion";
import { Aperture, Calendar, Camera, MapPin } from "lucide-react";
import type { PhotoData } from "@/lib/photo-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PhotoCardProps {
  photo: PhotoData;
  onClick: () => void;
  isInView?: boolean;
}

export function PhotoCard({ photo, onClick, isInView }: PhotoCardProps) {
  const imageDefaultWidth = 1000;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <Card
        className={`overflow-hidden transition-all duration-300 hover:shadow-lg ${
          isInView ? "ring-2 ring-blue-500" : ""
        }`}
      >
        <div className="relative group w-full cursor-zoom-in" onClick={onClick}>
          <img
            src={photo.thumbnail || "/placeholder.svg"}
            alt={photo.title}
            className="w-full h-auto object-cover"
            style={{ display: "block" }}
            width={imageDefaultWidth}
            height={Math.round(imageDefaultWidth / photo.aspectRatio)}
          />
          <div className="absolute inset-0 bg-black/0" />
        </div>

        <CardContent className="p-3 lg:p-4">
          <h3 className="font-semibold text-base lg:text-lg mb-2">
            {photo.title}
          </h3>
          <p className="text-muted-foreground text-sm mb-3">{photo.caption}</p>
          <div>
            <div className="space-y-2 text-sm text-muted-foreground font-mono">
              <div className="flex items-center gap-2">
                <MapPin className="w-3 h-3" />
                <span>{photo.location.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Camera className="w-3 h-3" />
                <span>{photo.metadata.camera}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3 h-3" />
                <span>{new Date(photo.dateTaken).toLocaleString("zh-cn")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Aperture className="w-3 h-3" />
                <span>
                  {photo.metadata.focal} • {photo.metadata.aperture} • {photo.metadata.shutterSpeed}{" "}
                  • ISO {photo.metadata.iso}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
            <div className="flex flex-wrap gap-1">
              {photo.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
