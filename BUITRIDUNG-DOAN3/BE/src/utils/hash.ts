export const comparePassword = (plainPassword: string, dbPassword: string): boolean => {
  return plainPassword === dbPassword;
};
