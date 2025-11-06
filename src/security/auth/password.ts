import bcrypt from 'bcrypt';

const saltRounds = 10; // Custo do hash (replicando o original)

/**
 * Gera um hash de uma senha em texto plano.
 * @param password - A senha para fazer o hash.
 * @returns Uma promessa que resolve para a string do hash.
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, saltRounds);
};

/**
 * Compara uma senha em texto plano com um hash existente.
 * @param password - A senha em texto plano fornecida pelo usuário.
 * @param hash - O hash armazenado no banco de dados.
 * @returns Uma promessa que resolve para true se a senha corresponder, false caso contrário.
 */
export const comparePassword = async (
  password: string,
  hash: string,
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};