const binary_search = (sorted_array: string[], target: string): boolean => {
  let left = 0;
  let right = sorted_array.length - 1;

  while (left <= right) {
    const mid_index = Math.floor((left + right) / 2);
    const mid_value = sorted_array[mid_index];

    if (mid_value === target) return true;

    if (mid_value < target) {
      left = mid_index + 1;
    } else {
      right = mid_index - 1;
    }
  }

  return false;
};

export { binary_search };
