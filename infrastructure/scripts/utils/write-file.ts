import fs from 'fs';
import path from 'path';
import { Stream } from 'stream';
import { v4 as uuidv4 } from 'uuid';

interface WriteFile {
  data:
    | string
    | NodeJS.ArrayBufferView
    | Iterable<string | NodeJS.ArrayBufferView>
    | AsyncIterable<string | NodeJS.ArrayBufferView>
    | Stream
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    | any[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    | Record<any, any>;
  file_name: string;
  folder?: string;
  uuid?: boolean;
}

export const write_file = async ({ data, file_name, folder, uuid }: WriteFile) => {
  if (folder) {
    if (!fs.existsSync(path.resolve('generated', folder))) {
      fs.mkdirSync(path.resolve('generated', folder));
    }
  }

  await fs.promises.writeFile(
    path.resolve('generated', folder || '', uuid ? `${uuidv4()}-${file_name}` : file_name),
    JSON.stringify(data, null, 2),
  );
};
