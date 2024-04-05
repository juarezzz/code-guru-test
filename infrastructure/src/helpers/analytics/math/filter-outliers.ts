/* ---------- Interfaces ---------- */
type FilterOutliersInput<T> = {
  array: T[];
  value_property: Extract<keyof T, IsNumericProperty<T>>;
};

type IsNumericProperty<T> = {
  [K in keyof T]: T[K] extends number ? K : never;
}[keyof T];

/* ---------- Functions ---------- */
const filter_outliers = <T>({
  array,
  value_property,
}: FilterOutliersInput<T>) => {
  try {
    if (array.length <= 3) return array;

    let quartile_1: number;
    let quartile_3: number;

    const values = array
      .slice()
      .sort(
        (a, b) => (a[value_property] as number) - (b[value_property] as number),
      );

    if ((values.length / 4) % 1 === 0) {
      const quartile_1_prev_value = values[values.length / 4][
        value_property
      ] as number;

      const quartile_1_next_value = values[values.length / 4 + 1][
        value_property
      ] as number;

      quartile_1 = (1 / 2) * quartile_1_prev_value + quartile_1_next_value;

      const quartile_3_prev_value = values[values.length * (3 / 4)][
        value_property
      ] as number;

      const quartile_3_next_value = values[values.length * (3 / 4) + 1][
        value_property
      ] as number;

      quartile_3 = (1 / 2) * (quartile_3_prev_value + quartile_3_next_value);
    } else {
      quartile_1 = values[Math.floor(values.length / 4 + 1)][
        value_property
      ] as number;

      quartile_3 = values[Math.ceil(values.length * (3 / 4) + 1)][
        value_property
      ] as number;
    }

    const inter_quartile_range = quartile_3 - quartile_1;

    const max_value = quartile_3 + inter_quartile_range * 1.5;
    const min_value = quartile_1 - inter_quartile_range * 1.5;

    return values.filter(value => {
      const current_value = value[value_property] as number;

      return current_value >= min_value && current_value <= max_value;
    });
  } catch (err) {
    console.log(`error at: filter_outliers: ${err}`);

    return array;
  }
};

export { filter_outliers };
