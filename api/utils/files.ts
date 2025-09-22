import fs from 'fs';
import path from 'path';

export function readFile(filePath: string, AsJson: boolean = false, DefaultValue: any = null) {
  if (!fs.existsSync(filePath)) {
    if (AsJson) {
      return DefaultValue;
    } else {
      return "";
    }
  }

  try {
    let fileContent = fs.readFileSync(filePath, 'utf-8');
    if (fileContent.charCodeAt(0) === 0xFEFF) {
        fileContent = fileContent.slice(1);
    }

    if (AsJson) {
      return JSON.parse(fileContent);
    } else {
      return fileContent;
    }
  } catch (err) {
    console.error(`Gagal membaca atau parsing file ${filePath}:`, err);
    if (AsJson) {
      return DefaultValue;
    } else {
      return "";
    }
  }
}
