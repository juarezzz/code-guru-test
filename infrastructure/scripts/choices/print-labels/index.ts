import { prompt } from 'enquirer';

/* ---------- Types ---------- */
import {
  NumberPrompt,
  StringPrompt,
} from '__scripts/choices/write-timestream-data/@types';

/* ---------- Scripts ---------- */
import { request_token } from '__scripts/utils/request-token';
import { confirm_labels } from '__scripts/choices/print-labels/confirm-labels';
import { create_labels } from '__scripts/choices/print-labels/create-labels';

/* ---------- Interfaces ---------- */
interface Environment {
  environment: string;
  next_token?: string;
}

export const print_labels = async ({ environment }: Environment) => {
  const username: StringPrompt = await prompt({
    message: 'What is your username? (email)',
    name: 'value',
    type: 'text',
  });

  const password: StringPrompt = await prompt({
    message: 'What is your password?',
    name: 'value',
    type: 'password',
  });

  const gtin: StringPrompt = await prompt({
    message: 'What GTIN do you to print?',
    name: 'value',
    type: 'text',
  });

  const size: NumberPrompt = await prompt({
    message: 'How many labels?',
    name: 'value',
    type: 'numeral',
  });

  const { id_token } = await request_token({
    environment,
    username: username.value,
    password: password.value,
  });

  const { serials } = await create_labels({
    environment,
    gtin: gtin.value,
    size: size.value,
    token: id_token,
  });

  await confirm_labels({
    environment,
    gtin: gtin.value,
    serials,
    token: id_token,
  });
};
