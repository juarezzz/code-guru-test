/* ---------- Interface ---------- */
interface Timer {
  seconds?: number;
  minutes?: number;
  hours?: number;
}

/* ---------- Functions ---------- */
const timer = async ({ seconds, hours, minutes }: Timer): Promise<void> => {
  let ms = 0;

  if (seconds) ms += seconds * 1000;
  if (minutes) ms += minutes * 60 * 1000;
  if (hours) ms += hours * 60 * 60 * 1000;

  return new Promise<void>(resolve => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
};

export { timer };
