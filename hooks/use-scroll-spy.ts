"use client";

import { useEffect, useState, useCallback } from "react";

export function useScrollSpy(elementIds: string[], offset = 0) {
  const [activeId, setActiveId] = useState<string>("");
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const nodeCallback = useCallback((node: HTMLDivElement) => {
    setNode(node);
  }, []);

  useEffect(() => {
    if (!node) return;
    let visibleList: Array<string> = [];
    let innerActiveId: string;
    const observer = new IntersectionObserver(
      (entries) => {
        console.log(entries);
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            visibleList.push(entry.target.id);
            innerActiveId = entry.target.id;
            setActiveId(entry.target.id);
            console.log("add", entry.target.id, visibleList);
          } else {
            visibleList = visibleList.filter((x) => x !== entry.target.id);
            if (innerActiveId == entry.target.id) {
              setActiveId(visibleList[0]);
              innerActiveId = visibleList[visibleList.length - 1];
            }
            console.log("remove", entry.target.id, visibleList);
          }
        });
      },
      {
        root: node,
        threshold: 0,
        rootMargin: "-20% 0px -30% 0px",
      }
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
  }, [elementIds, offset, node]);

  return { activeId, nodeCallback };
}
