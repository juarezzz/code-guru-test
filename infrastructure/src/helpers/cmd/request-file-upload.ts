/* ---------- External ---------- */
import { prompt } from 'enquirer';

/* ---------- Helpers ---------- */
import { handleCMDInteraction } from '_helpers/cmd/handle-cmd-interaction';

/* -------------- Interfaces -------------- */
interface FileUpload {
  upload: string;
}

interface Environment {
  action: string;
  aws_account: string;
  environment: string;
  stack: string;
}

/* ---------- Function ---------- */
const requestFileUpload = async (
  message: string,
  environment: Environment,
  local_file: string,
  s3_bucket: string,
): Promise<void> => {
  const file_upload: FileUpload = await prompt([
    {
      choices: ['Yes', 'No'],
      message,
      name: 'upload',
      type: 'select',
    },
  ]);

  if (file_upload.upload === 'Yes') {
    const upload_cmd = `aws s3 cp --profile ${environment.aws_account} ${local_file} ${s3_bucket}`;

    handleCMDInteraction(
      upload_cmd,
      'File successfully uploaded!',
      'Failed to upload file, continuing anyway.',
      true,
    );
  }
};

/* ---------- Exports ---------- */
export { requestFileUpload };
