/*
 * Arquivo: src/utils/validators/cnpj.validator.ts
 * Descrição: Schema de validação (Zod) específico para CNPJ.
 * (Migração de utils/cnpjValidator.js)
 *
 * Alterações:
 * 1. [Robustez/Segurança] Aprimorada a função `validateCNPJ`.
 * 2. Adicionada uma verificação de Regex (`/^(\d)\1{13}$/.test(cnpj)`)
 * para rejeitar CNPJs com todos os dígitos iguais
 * (ex: '00000000000000', '11111111111111').
 * 3. Estes números são inválidos mas, por uma falha matemática
 * do algoritmo, passariam no cálculo do dígito verificador.
 * 4. [Clean Code] O ficheiro já estava bem estruturado.
 * A lógica de `unformatCNPJ` (transform) e `validateCNPJ` (refine)
 * está correta.
 */

import { z } from 'zod';

/**
 * Remove a formatação (pontos, barras, traços) do CNPJ.
 * @param cnpj - O CNPJ formatado (ex: "00.000.000/0000-00")
 * @returns O CNPJ com apenas dígitos (ex: "00000000000000")
 */
const unformatCNPJ = (cnpj: string): string => {
  return cnpj.replace(/[^\d]+/g, ''); // Remove tudo que não for dígito
};

/**
 * Valida a lógica matemática (dígitos verificadores) de um CNPJ.
 * (Baseado na lógica do utils/cnpjValidator.js original)
 *
 * @param cnpj - O CNPJ (já sem formatação, com 14 dígitos)
 * @returns true se os dígitos verificadores forem válidos, false caso contrário.
 */
const validateCNPJ = (cnpj: string): boolean => {
  // [FIX] Rejeita CNPJs com todos os dígitos iguais (ex: 11.111.111/1111-11)
  // Esta verificação é crucial, pois estes CNPJs passam no cálculo do DV.
  if (/^(\d)\1{13}$/.test(cnpj)) {
    return false;
  }

  // Lógica de cálculo do dígito verificador (DV)
  let tamanho = cnpj.length - 2;
  let numeros = cnpj.substring(0, tamanho);
  const digitos = cnpj.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--;
    if (pos < 2) {
      pos = 9;
    }
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0), 10)) {
    return false;
  }

  tamanho = tamanho + 1;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--;
    if (pos < 2) {
      pos = 9;
    }
  }

  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(1), 10)) {
    return false;
  }

  return true;
};

/**
 * Schema Zod completo para validação de CNPJ.
 * 1. Requerido.
 * 2. Transforma (remove formatação).
 * 3. Refina (verifica o comprimento de 14 dígitos).
 * 4. Refina (valida os dígitos verificadores).
 */
export const cnpjValidator = z
  .string({
    required_error: 'O CNPJ é obrigatório.',
    invalid_type_error: 'O CNPJ deve ser uma string.',
  })
  .transform(unformatCNPJ) // 1. Remove formatação
  .refine((cnpj) => cnpj.length === 14, {
    // 2. Verifica o comprimento
    message: 'O CNPJ deve ter 14 dígitos (após remover a formatação).',
  })
  .refine(validateCNPJ, {
    // 3. Valida a lógica
    message: 'O CNPJ fornecido é inválido.',
  });