import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

export default function SEO({
  title = 'Navi — Hampton Roads Explorer',
  description = 'Discover the best places and events across Hampton Roads. Build credibility, get personalized suggestions, and explore with intention.',
  image = '/og-image.svg',
  url = 'https://navi.757tech.pro',
}: SEOProps) {
  useEffect(() => {
    document.title = title;
    const setMeta = (attrName: 'name' | 'property', attrValue: string, content: string) => {
      const selector = `meta[${attrName}="${attrValue}"]`;
      let el = document.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrValue);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('name', 'description', description);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:image', image);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:type', 'website');
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', image);
  }, [title, description, image, url]);

  return null;
}
