import React from "react";
import { mdToHtml } from "../../utils/string";

interface MarkdownRendererProps {
  markdown: string;
  className?: string;
}

export const MarkdownDiv: React.FC<MarkdownRendererProps> = ({ markdown, className }) => {
  let html = mdToHtml(markdown);
  
  const baseUrl = import.meta.env.VITE_APP_URL;
  
  html = html.replace(
    /<a\s+(?![^>]*target=)([^>]*href="([^"]+)"[^>]*)>/g,
    (match, attributes, href) => {
      // Check if href matches base URL or is a relative/same-origin link
      if (href.startsWith(baseUrl) || href.startsWith('/') || !href.includes('://')) {
        return match; // Return original without target="_blank"
      }
      return `<a ${attributes} target="_blank" rel="noopener noreferrer">`;
    }
  );

  return (
    <div
      className={`markdown-body ${className}`}
      dangerouslySetInnerHTML={{ __html: html  }}
    />
  );
};

export default MarkdownDiv;
