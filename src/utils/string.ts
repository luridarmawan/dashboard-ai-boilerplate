// utils/mdToHtml.ts
import { marked } from "marked";
import DOMPurify from "dompurify";

export function mdToHtml(md: string): string {
  const rawHtml = marked.parse(md, { breaks: true }) as string;
  return DOMPurify.sanitize(rawHtml);
}

export function ucwords(str: string): string {
  return (str + '').replace(/^([a-z])|\s+([a-z])/g, function ($1) {
    return $1.toUpperCase();
  });
}
