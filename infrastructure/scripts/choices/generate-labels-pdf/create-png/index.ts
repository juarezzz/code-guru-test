import QRCode from 'qrcode';
import fs_prom from 'fs/promises';
import path from 'path';

export const create_png = async (urls: string[], name: string) => {
  for (let i = 0; i < urls.length; i += 1) {
    const url = await QRCode.toDataURL(urls[i]);
    const base64 = url.replace(/^data:image\/png;base64,/, '');

    await fs_prom.writeFile(
      path.resolve(
        __dirname,
        '..',
        'pngs',
        `${name.toLowerCase().replace(/ /g, '_')}_${i}.png`,
      ),
      base64,
      'base64',
    );
  }
};
