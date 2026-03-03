import { useState, useEffect } from "react";

// Single source of truth for responsive layout
export const BREAKPOINTS = { sm: 640, md: 960 };

export const useBreakpoint = () => {
  const [width, setWidth] = useState(window.innerWidth);

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
    // Convenience: anything narrower than tablet
    isSmall:   width < BREAKPOINTS.md,
  };
};
