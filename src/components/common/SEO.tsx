import { useEffect } from 'react';

interface Props {
  title: string;
  description?: string;
}

const SITE_NAME = 'CoffeeCraze';

export default function SEO({ title, description }: Props) {
  useEffect(() => {
    document.title = `${title} | ${SITE_NAME}`;
  }, [title]);

  useEffect(() => {
    if (!description) return;
    const existing = document.querySelector('meta[name="description"]');
    if (existing) {
      existing.setAttribute('content', description);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = description;
      document.head.appendChild(meta);
    }
  }, [description]);

  return null;
}
