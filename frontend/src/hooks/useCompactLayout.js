import { useEffect, useState } from "react";

const COMPACT_MEDIA_QUERY = "(max-width: 48.75rem)";

export default function useCompactLayout() {
  const [compact, setCompact] = useState(
    () =>
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia(COMPACT_MEDIA_QUERY).matches
  );

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return undefined;

    const mediaQuery = window.matchMedia(COMPACT_MEDIA_QUERY);
    const handleChange = (event) => setCompact(event.matches);
    setCompact(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return compact;
}

export { COMPACT_MEDIA_QUERY };
