
export function removeCommentLines(input: string, removeEmptyLines: boolean = false): string {
  let output = input.replace(/^\s*\/\/.*$/gm, '');
  if (removeEmptyLines) {
    output = output.replace(/^\s*$/gm, '');
  }
  return output.trim();
}

export function getBaseUrl(fullUrl: string): string {
  try {
    const url = new URL(fullUrl);
    return `${url.protocol}//${url.hostname}`;
  } catch (error) {
    throw new Error('Invalid URL provided');
  }
}

export function ucwords(str: string): string {
  return (str + '').replace(/^([a-z])|\s+([a-z])/g, function ($1) {
    return $1.toUpperCase();
  });
}
