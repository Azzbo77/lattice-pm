import { useState, useEffect } from "react";

export const BREAKPOINTS = { sm: 640, md: 960 } as const;

export interface Breakpoint {
  width: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isSmall: boolean;
}

export const useBreakpoint = (): Breakpoint => {
  const [width, setWidth] = useState<number>(window.innerWidth);

  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return {
    width,
    isMobile:  width < BREAKPOINTS.sm,
    isTablet:  width >= BREAKPOINTS.sm && width < BREAKPOINTS.md,
    isDesktop: width >= BREAKPOINTS.md,
    isSmall:   width < BREAKPOINTS.md,
  };
};
