/* ---------- Types ---------- */
type PaginableFunctionInput = {
  last_key?: string;
};

interface PaginableFunctionOutput {
  last_evaluated_key?: string;
}

type PaginableFunction = (
  _: PaginableFunctionInput,
) => Promise<PaginableFunctionOutput> | PaginableFunctionOutput;

type DynamicOmit<T, K extends string> = T extends Promise<infer U>
  ? Promise<Omit<U, K>>
  : Omit<T, K>;

type PaginateFunctionParams<T extends PaginableFunction> = Omit<
  Parameters<T>[0],
  'last_key'
>;

type PaginateFunctionOutput<T extends PaginableFunction> = Record<
  string,
  unknown
> &
  DynamicOmit<ReturnType<T>, 'last_evaluated_key'>;

/* ---------- Functions ---------- */
const paginate_function = async <T extends PaginableFunction>(
  fn: T,
  params: PaginateFunctionParams<T>,
): Promise<PaginateFunctionOutput<T>> => {
  let last_key: string | undefined;
  let output: PaginateFunctionOutput<T> | undefined;

  do {
    const fn_result = await fn({ ...params, last_key });

    last_key = fn_result.last_evaluated_key;

    if (!output) {
      output = fn_result as PaginateFunctionOutput<T>;

      continue;
    }

    Object.entries(fn_result).forEach(([key, value]) => {
      if (!output) output = {} as PaginateFunctionOutput<T>;

      if (Array.isArray(value)) {
        output[key] = [...((output?.[key] || []) as Array<unknown>), ...value];

        return;
      }

      if (typeof value === 'object') {
        output[key] = { ...(output?.[key] || {}), ...value };

        return;
      }

      output[key] = value;
    });
  } while (last_key);

  return output;
};

export { paginate_function };
