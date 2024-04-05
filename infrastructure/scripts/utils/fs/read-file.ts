import fs from 'fs';
import path from 'path';

interface ReadFile {
  file_name: string;
  folder: string;
}

export const read_file = async ({ file_name, folder }: ReadFile) => {
  const file = await fs.promises.readFile(path.resolve('generated', folder, file_name), 'utf8');

  return JSON.parse(file);
};
