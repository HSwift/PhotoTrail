"use client";

import { useEffect, useState } from "react";

export function useScrollSpy(elementIds: string[]) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    let visibleIdMap: {[key: string]: number} = {};

    const observer = new IntersectionObserver(
      (entries) => {
        console.log(entries);
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            visibleIdMap[entry.target.id] = entry.intersectionRatio;
          } else {
            delete visibleIdMap[entry.target.id];
          }

          let ids = Object.keys(visibleIdMap);
          ids.sort((left, right) => visibleIdMap[right] - visibleIdMap[left]);
          if (ids.length > 0) {
            setActiveId(ids[0]);
          }
        });
      },
      {
        root: document.querySelector("#photo-feed"),
        threshold: 0,
        rootMargin: "-20% 0px -30% 0px",
      },
    );

    elementIds.forEach((id) => {
      console.log("enter");
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      console.log("exit");
      elementIds.forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
          observer.unobserve(element);
        }
      });
    };
  }, [elementIds]);

  return activeId;
}
