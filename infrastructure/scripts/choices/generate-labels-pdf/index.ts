import PDF from 'pdfkit';
import fs from 'fs';
import { prompt } from 'enquirer';
import path from 'path';

/* ---------- Types ---------- */
import { NumberPrompt, StringPrompt } from '__scripts/choices/write-timestream-data/@types';

/* ---------- Scripts ---------- */
import { request_token } from '__scripts/utils/request-token';
import { confirm_labels } from '__scripts/choices/generate-labels-pdf/confirm-labels';
import { create_png } from '__scripts/choices/generate-labels-pdf/create-png';
import { request_labels } from '__scripts/choices/generate-labels-pdf/request-labels';

/* ---------- Interfaces ---------- */
interface Environment {
  environment: string;
  next_token?: string;
}

interface User {
  full_name: string;
}

export const generate_labels_pdf = async ({ environment }: Environment) => {
  const username: StringPrompt = await prompt({
    message: 'What is your username? (email)',
    name: 'value',
    type: 'text',
  });

  const password: StringPrompt = await prompt({
    message: 'What is your password?',
    name: 'value',
    type: 'text',
  });

  const { id_token } = await request_token({
    environment,
    username: username.value,
    password: password.value,
  });

  const number_of_users: NumberPrompt = await prompt({
    message: 'How many users do you want to generate?',
    name: 'value',
    type: 'numeral',
  });

  const users: User[] = [];
  const gtins: string[] = [];

  for (let i = 0; i < number_of_users.value; i += 1) {
    const user_name: StringPrompt = await prompt({
      message: `What is the full name of the user ${i + 1}?`,
      name: 'value',
      type: 'text',
    });

    users.push({
      full_name: user_name.value,
    });
  }

  const number_of_gtins: NumberPrompt = await prompt({
    message: 'How many GTINs do you want to generate?',
    name: 'value',
    type: 'numeral',
  });

  for (let i = 0; i < number_of_gtins.value; i += 1) {
    const gtin: StringPrompt = await prompt({
      message: `What is the GTIN (${i + 1})?`,
      name: 'value',
      type: 'text',
    });

    gtins.push(gtin.value);
  }

  const users_data = [];

  for (let i = 0; i < users.length; i += 1) {
    for (let j = 0; j < gtins.length; j += 1) {
      const { to_confirm, labels } = await request_labels(environment, gtins[j], id_token);

      const user_pdf = {
        gtin: to_confirm.gtin,
        labels,
      };

      users_data.push({ full_name: users[i].full_name, pdfs: [user_pdf] });

      await confirm_labels(environment, to_confirm.gtin, to_confirm.serials, id_token);
    }
  }

  for (let i = 0; i < users_data.length; i += 1) {
    for (let j = 0; j < users_data[i].pdfs.length; j += 1) {
      await create_png(users_data[i].pdfs[j].labels, `${users_data[i].full_name}`);
    }
  }

  const doc = new PDF({ size: 'A4', margin: 8 });

  doc.font(path.resolve(__dirname, 'Inter-Bold.ttf'));

  doc
    .moveTo(0, 0)
    .path(
      'M0,64L40,85.3C80,107,160,149,240,154.7C320,160,400,128,480,112C560,96,640,96,720,106.7C800,117,880,139,960,122.7C1040,107,1120,53,1200,53.3C1280,53,1360,107,1400,133.3L1440,160L1440,0L1400,0C1360,0,1280,0,1200,0C1120,0,1040,0,960,0C880,0,800,0,720,0C640,0,560,0,480,0C400,0,320,0,240,0C160,0,80,0,40,0L0,0Z',
    )
    .fillOpacity(1)
    .fillAndStroke('#8fc642', '#8fc642');

  doc.fontSize(14);
  doc.fillColor('#ffffff').text('Polytag Labels', 0, 40, { align: 'center' });

  doc.fontSize(16);
  doc.fillColor('#ffffff').text(users_data[0].pdfs[0].gtin, 0, 84, { align: 'center' });

  users_data.forEach((item, index) => {
    const x = (index % 3) * 144 + 80;
    const y = Math.floor(index / 3) * 160 + 180;

    doc.image(
      path.resolve(__dirname, 'pngs', `${item.full_name.toLowerCase().replace(/ /g, '_')}_0.png`),
      x,
      y,
      {
        width: 144,
        height: 144,
      },
    );

    doc.fontSize(6);
    doc.fillColor('#000000').text(item.pdfs[0].labels, x, y + 144);
  });

  doc.end();

  doc.pipe(fs.createWriteStream(path.resolve(__dirname, 'pdfs', `coop.pdf`)));
};
