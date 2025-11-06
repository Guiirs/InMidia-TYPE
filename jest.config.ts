/**
 * Configuração do Jest para TypeScript.
 * (Baseado no jest.config.js original, mas adaptado para ts-jest)
 */
import type { Config } from 'jest';

const config: Config = {
  // Informa ao Jest para usar o preset 'ts-jest'
  preset: 'ts-jest',

  // O ambiente de teste (node)
  testEnvironment: 'node',

  // Executa este arquivo de setup ANTES de cada suíte de teste
  // (Aqui é onde vamos conectar ao Mongo-in-memory)
  setupFilesAfterEnv: ['./tests/jest.setup.ts'],

  // Timeout para testes (aumentado para o DB em memória iniciar)
  testTimeout: 15000,

  // Limpa mocks entre os testes
  clearMocks: true,

  // Onde procurar por arquivos de teste
  testMatch: ['<rootDir>/tests/**/*.test.ts'],

  // Mapeamento de caminhos (para 'zod' e outros)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Coletar cobertura de código
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  collectCoverageFrom: ['src/services/**/*.ts', 'src/repositories/**/*.ts'],
};

export default config;