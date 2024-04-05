function filterOutliers(someArray: number[]) {
  try {
    if (someArray.length < 4) return someArray;

    let q1;
    let q3;

    const values = someArray.slice().sort((a, b) => a - b);

    if ((values.length / 4) % 1 === 0) {
      // find quartiles
      q1 =
        (1 / 2) * (values[values.length / 4] + values[values.length / 4 + 1]);
      q3 =
        (1 / 2) *
        (values[values.length * (3 / 4)] + values[values.length * (3 / 4) + 1]);
    } else {
      q1 = values[Math.floor(values.length / 4 + 1)];
      q3 = values[Math.ceil(values.length * (3 / 4) + 1)];
    }

    const iqr = q3 - q1;
    const maxValue = q3 + iqr * 1.5;
    const minValue = q1 - iqr * 1.5;

    return values.filter(x => x >= minValue && x <= maxValue);
  } catch (err) {
    console.error(err);

    return someArray;
  }
}

const mean = (values: number[]) => {
  // eslint-disable-next-line no-return-assign
  const sum = values.reduce((previous, current) => (current += previous), 0);
  return sum / values.length;
};

const median = (arr: number[]) => {
  if (arr.length === 0) return 0;
  const mid = Math.floor(arr.length / 2);
  const sorted = [...arr].sort((a, b) => a - b);
  return arr.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
};

export { filterOutliers, mean, median };
