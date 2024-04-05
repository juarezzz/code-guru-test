/* ---------- External ---------- */
import _ from 'lodash';

/* ---------- Interface ---------- */
interface GetObjectArraysDifferenceInput<T = Record<string, unknown>> {
  base_array: T[];
  change_array: T[];
  relevant_properties?: (keyof T)[];
}

/* ---------- Functions ---------- */
export const get_object_arrays_difference = <T>({
  base_array,
  change_array,
  relevant_properties,
}: GetObjectArraysDifferenceInput<T>): T[] => {
  if (!base_array[0]) return [];

  const relevant_properties_updated =
    relevant_properties || (Object.keys(base_array[0]) as (keyof T)[]);

  const difference: T[] = base_array.reduce((result, current_item) => {
    const new_groups_equivalent = change_array.find(change_array_item => {
      const matches = relevant_properties_updated.every(property => {
        if (Array.isArray(change_array_item?.[property])) {
          return _.isEqual(
            current_item?.[property],
            change_array_item?.[property],
          );
        }

        return current_item?.[property] === change_array_item?.[property];
      });

      return matches;
    });

    if (!new_groups_equivalent) result.push(current_item);

    return result;
  }, [] as T[]);

  return difference;
};
