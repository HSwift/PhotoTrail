"use client";

import { useEffect, useState, useCallback } from "react";

export function useScrollSpy(elementIds: string[]) {
  const [activeId, setActiveId] = useState<string>("");
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const nodeCallback = useCallback((node: HTMLDivElement) => {
    setNode(node);
  }, []);

  useEffect(() => {
    if (!node) return;
    let visibleIdMap: {[key: string]: number} = {};

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            visibleIdMap[entry.target.id] = entry.intersectionRatio;
          } else {
            delete visibleIdMap[entry.target.id];
          }
        });

        let ids = Object.keys(visibleIdMap);
        ids.sort((left, right) => visibleIdMap[right] - visibleIdMap[left]);
        if (ids.length > 0) {
          setActiveId(ids[0]);
        }
      },
      {
        root: node,
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.99],
        rootMargin: "-20% 0px -30% 0px",
      }
    );

    elementIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      elementIds.forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
          observer.unobserve(element);
        }
      });
    };
  }, [elementIds, node]);

  return { activeId, nodeCallback };
}
