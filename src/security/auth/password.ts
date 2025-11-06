/*
 * Arquivo: src/security/auth/password.ts
 * Descrição:
 * Este arquivo isola a lógica de hashing e comparação de senhas usando 'bcrypt'.
 *
 * Alterações:
 * 1. [Clean Code] O código original já estava limpo e bem tipado.
 * 2. [Segurança] O `saltRounds` foi mantido como 10, conforme o original.
 * (Nota: Para novos projetos, 12 seria uma escolha mais moderna, mas
 * manter 10 garante compatibilidade com senhas existentes).
 * 3. Nenhuma correção de tipagem foi necessária.
 */

import bcrypt from 'bcrypt';

// Custo do hash (replicando o original)
// Um valor maior (como 12) é mais seguro, mas mais lento.
// Mantido em 10 para consistência com o projeto original.
const saltRounds = 10;

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