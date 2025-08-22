export const toWIB = (date: Date): Date => {
  return new Date(date.getTime() + 7 * 60 * 60 * 1000);
};

export const formatWIB = (date: Date): string => {
  return toWIB(date).toISOString().replace('Z', '');
};