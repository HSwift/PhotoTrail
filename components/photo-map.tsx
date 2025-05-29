"use client";

import { useEffect, useRef, useState } from "react";
import type { PhotoData } from "@/lib/photo-data";
import { useIsMobile } from "@/hooks/use-mobile";
import mapboxgl  from 'mapbox-gl'

interface PhotoMapProps {
  photos: PhotoData[];
  currentPhotoIndex: number;
}

export function PhotoMap({ photos, currentPhotoIndex }: PhotoMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!mapContainer.current || !mapboxgl) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [photos[0]?.location.lng || 0, photos[0]?.location.lat || 0],
      zoom: 2,
    });

    map.current.on("load", () => {
      setMapLoaded(true);
    });

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [mapboxgl, photos]);

  useEffect(() => {
    if (!map.current || !mapLoaded || !mapboxgl) return;

    // Clear existing markers
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];

    // Add markers for all photos
    photos.forEach((photo, index) => {
      const el = document.createElement("div");
      el.className =
        `w-4 h-4 rounded-full border-2 border-white cursor-pointer transition-all duration-300 ${
          index === currentPhotoIndex
            ? "bg-blue-500 w-6 h-6 shadow-lg"
            : index <= currentPhotoIndex
            ? "bg-blue-400"
            : "bg-gray-400"
        }`;

      const marker = new mapboxgl.Marker(el)
        .setLngLat([photo.location.lng, photo.location.lat])
        .addTo(map.current!);

      marker.getElement().addEventListener("click", () => {
        const photoElement = document.getElementById("photo-" + photo.id)!;
        photoElement.scrollIntoView({
          block: 'center',
          behavior: "smooth",
        });
      });

      markers.current.push(marker);
    });

    // Draw path between visited photos
    if (currentPhotoIndex > 0) {
      const visitedPhotos = photos.slice(0, currentPhotoIndex + 1);
      const coordinates = visitedPhotos.map((
        photo,
      ) => [photo.location.lng, photo.location.lat]);

      if (map.current!.getSource("route")) {
        map.current!.getSource("route").setData({
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates,
          },
        });
      } else {
        map.current!.addSource("route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates,
            },
          },
        });

        map.current!.addLayer({
          id: "route",
          type: "line",
          source: "route",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#3b82f6",
            "line-width": 3,
            "line-opacity": 0.8,
          },
        });
      }
    } else {
      if (map.current!.getSource("route")) {
        map.current!.getSource("route").setData({
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: [],
          },
        });
      }
    }

    // Fly to current photo location
    if (photos[currentPhotoIndex]) {
      map.current!.flyTo({
        center: [
          photos[currentPhotoIndex].location.lng,
          photos[currentPhotoIndex].location.lat,
        ],
        zoom: 8,
        duration: 2000,
      });
    }
  }, [photos, currentPhotoIndex, mapLoaded, mapboxgl]);

  if (!mapboxgl) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2">
          </div>
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      <div ref={mapContainer} className="h-full w-full" />
      {!isMobile
        ? (
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
            <h3 className="font-semibold text-sm mb-1">
              {photos[currentPhotoIndex].title}
            </h3>
            <p className="text-xs mb-1">
              {new Date(photos[currentPhotoIndex].dateTaken).toLocaleDateString(
                "zh-cn",
              )} {photos[currentPhotoIndex].location.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {currentPhotoIndex + 1} of {photos.length} photos
            </p>
          </div>
        )
        : null}
    </div>
  );
}
