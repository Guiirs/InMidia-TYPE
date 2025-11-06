/*
 * Arquivo: src/api/services/src/empresa.service.ts
 * Descrição: Serviço para a lógica de negócios da Entidade Empresa.
 *
 * Alterações (Correção de Bug TS2339):
 * 1. [FIX] Adicionado o método `findEmpresaById(empresaId)`.
 * 2. Este método é necessário para o `empresa.controller.ts`
 * (que é chamado pela rota GET /api/v1/empresa/details),
 * mas não existia neste ficheiro de serviço.
 */

import { logger } from '@/config/logger';
import {
  empresaRepository,
  EmpresaRepository,
} from '@/db/repositories/empresa.repository';
import { HttpError } from '@/utils/errors/httpError';
import { UpdateEmpresaDto } from '@/utils/validators/user.validator';
import { IEmpresa } from '@/db/models/empresa.model';
import { Types } from 'mongoose';

/**
 * Serviço responsável pela lógica de negócios da Entidade Empresa.
 */
export class EmpresaService {
  constructor(private readonly empresaRepo: EmpresaRepository) {}

  /**
   * [NOVO - CORRIGIDO] Busca os detalhes de uma empresa pelo ID.
   *
   * @param empresaId - ID da empresa (vinda do token do admin)
   * @returns Os dados da empresa.
   */
  async findEmpresaById(
    empresaId: string | Types.ObjectId,
  ): Promise<IEmpresa> {
    logger.debug(`[EmpresaService] Buscando empresa por ID: ${empresaId}`);

    const empresa = await this.empresaRepo.findById(empresaId);

    if (!empresa) {
      throw new HttpError('Empresa não encontrada.', 404);
    }

    // .toJSON() remove campos sensíveis (api_key_hash)
    return empresa.toJSON();
  }

  /**
   * Atualiza os detalhes da empresa (nome, cnpj, endereço).
   * Ação geralmente realizada por um admin da empresa.
   *
   * @param empresaId - ID da empresa (vinda do token do admin)
   * @param dto - Dados a serem atualizados (nome, cnpj, endereco, etc.)
   * @returns Os dados atualizados da empresa.
   */
  async updateEmpresaDetails(
    empresaId: string | Types.ObjectId,
    dto: UpdateEmpresaDto,
  ): Promise<IEmpresa> {
    logger.info(
      `[EmpresaService] Admin (Empresa: ${empresaId}) requisitou updateEmpresaDetails.`,
    );

    try {
      const empresaAtualizada = await this.empresaRepo.findByIdAndUpdate(
        empresaId,
        dto, // Passa o DTO limpo diretamente
      );

      if (!empresaAtualizada) {
        throw new HttpError('Empresa não encontrada para atualização.', 404);
      }

      logger.info(
        `[EmpresaService] Detalhes da empresa ${empresaId} atualizados.`,
      );
      // .toJSON() remove campos sensíveis (api_key_hash)
      return empresaAtualizada.toJSON();
    } catch (error: unknown) {
      // Trata erros de duplicado 11000 (ex: CNPJ)
      if (error instanceof Error && (error as any).code === 11000) {
        const keyValue = (error as any).keyValue;
        const campo = Object.keys(keyValue)[0];
        logger.warn(
          `[EmpresaService] updateEmpresaDetails falhou (Duplicado 11000): ${campo} = ${keyValue[campo]}`,
        );
        throw new HttpError(
          `O ${campo} '${keyValue[campo]}' já está a ser utilizado por outra empresa.`,
          409,
        );
      }
      
      logger.error(error, `[EmpresaService] Erro ao atualizar empresa ${empresaId}`);
      throw error; // Repassa outros erros
    }
  }
}

/**
 * Instância padrão (singleton) do serviço.
 */
export const empresaService = new EmpresaService(empresaRepository);