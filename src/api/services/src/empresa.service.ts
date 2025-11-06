import { logger } from '@/config/logger';
import {
  empresaRepository,
  EmpresaRepository,
} from '@/db/repositories/empresa.repository';
import { HttpError } from '@/utils/errors/httpError';
import { UpdateEmpresaDto } from '@/utils/validators/user.validator'; // (Reutilizando o DTO que já definimos)
import { IEmpresa } from '@/db/models/empresa.model';
import { Types } from 'mongoose';

/**
 * Serviço responsável pela lógica de negócios da Entidade Empresa.
 * (Migração de services/empresaService.js -> updateEmpresaDetails)
 */
export class EmpresaService {
  constructor(private readonly empresaRepo: EmpresaRepository) {}

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

    // O DTO (UpdateEmpresaDto) já foi validado (pelo Zod)
    // para não permitir campos sensíveis (como api_key_hash).
    // A lógica de remoção de campos sensíveis (JS) é agora garantida pelo DTO.

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