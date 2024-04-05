interface HttpErrorInput {
  status_code: number;
  message: string;
  code?: string;
}

export const httpError = ({
  message,
  status_code,
  code,
}: HttpErrorInput): string =>
  JSON.stringify({
    message,
    status_code,
    code,
  });
