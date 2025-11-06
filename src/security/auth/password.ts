/*
 * Arquivo: src/security/auth/password.ts
 * Descrição:
 * Este arquivo isola a lógica de hashing e comparação de senhas usando 'bcrypt'.
 *
 * Alterações (Melhoria de Segurança #3):
 * 1. [Segurança] Removido o `saltRounds = 10` "hardcoded" (valor fixo no código).
 * 2. [Configurabilidade] Importado o objeto `config` (de `src/config/index.ts`).
 * 3. [Segurança] A constante `saltRounds` agora usa `config.BCRYPT_SALT_ROUNDS`.
 * Isso permite que o custo do hash (ex: 10, 11, 12) seja facilmente ajustado
 * no ficheiro .env em ambientes de produção, sem alterar o código.
 */

import bcrypt from 'bcrypt';
// [NOVO] Importa a configuração centralizada
import { config } from '@/config/index';

// [ALTERADO] O custo do hash agora é lido da configuração centralizada.
// O padrão (definido no config.ts) é 10, mantendo a compatibilidade original.
const saltRounds = config.BCRYPT_SALT_ROUNDS;

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