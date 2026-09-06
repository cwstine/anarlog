import { useEffect, useState } from "react";
// @ts-ignore virtual module provided by ./vite.ts
import { latestContent, latestVersion } from "virtual:changelog";

import { processContent } from "@anlg/changelog";

export function getLatestVersion(): string | null {
  return latestVersion;
}

export function useChangelogContent(version: string) {
  const [content, setContent] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (version === latestVersion && latestContent) {
      const { content: parsed, date: parsedDate } = processContent(latestContent);
      setContent(parsed);
      setDate(parsedDate);
      setLoading(false);
      return;
    }

    setContent(null);
    setDate(null);
    setLoading(false);
  }, [version]);

  return { content, date, loading };
}
