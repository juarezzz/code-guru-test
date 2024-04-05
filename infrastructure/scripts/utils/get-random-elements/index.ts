export const get_random_elements = <T>(array: T[], n: number): T[] => {
  const copy = array.slice();
  const shuffled = copy.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
};
