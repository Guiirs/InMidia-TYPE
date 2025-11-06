import { Types } from 'mongoose';
import { logger } from '@/config/logger';
import { IRegiao } from '@/db/models/regiao.model';
import {
  regiaoRepository,
  RegiaoRepository,
} from '@/db/repositories/regiao.repository';
import {
  placaRepository,
  PlacaRepository,
} from '@/db/repositories/placa.repository'; // Necessário para a verificação de exclusão
import { HttpError } from '@/utils/errors/httpError';
import { CreateRegiaoDto } from '@/utils/validators/regiao.validator';

/**
 * Serviço responsável pela lógica de negócios de Regiões.
 * (Migração de services/regiaoService.js)
 */
export class RegiaoService {
  constructor(
    private readonly regiaoRepo: RegiaoRepository,
    private readonly placaRepo: PlacaRepository,
  ) {}

  /**
   * Obtém todas as regiões de uma empresa.
   * (Migração de services/regiaoService.js -> getAll)
   *
   * @param empresaId - ID da empresa (do token JWT)
   * @returns Array de regiões.
   */
  async getAll(empresaId: string | Types.ObjectId): Promise<IRegiao[]> {
    logger.info(`[RegiaoService] Buscando todas as regiões para empresa ${empresaId}.`);
    // O repositório já retorna .lean() e ordenado por nome
    return this.regiaoRepo.findAllByEmpresa(empresaId);
  }

  /**
   * Cria uma nova região para uma empresa.
   * (Migração de services/regiaoService.js -> create)
   *
   * @param dto - Contém o 'nome' da nova região
   * @param empresaId - ID da empresa (do token JWT)
   * @returns A nova região criada.
   */
  async create(
    dto: CreateRegiaoDto,
    empresaId: string | Types.ObjectId,
  ): Promise<IRegiao> {
    const { nome } = dto;
    logger.info(
      `[RegiaoService] Tentando criar região '${nome}' para empresa ${empresaId}.`,
    );

    // 1. Verifica duplicatas (lógica do original)
    const existe = await this.regiaoRepo.findByName(nome, empresaId);
    if (existe) {
      throw new HttpError(
        `Já existe uma região com o nome '${nome}' na sua empresa.`,
        409, // Conflict
      );
    }

    // 2. Cria
    try {
      const novaRegiao = await this.regiaoRepo.create({
        nome,
        empresa: new Types.ObjectId(empresaId),
      });
      return novaRegiao.toJSON();
    } catch (error: unknown) {
      // Fallback (se o findByName falhar em race condition)
      if (error instanceof Error && (error as any).code === 11000) {
        throw new HttpError(
          `Já existe uma região com o nome '${nome}' na sua empresa.`,
          409,
        );
      }
      logger.error(error, '[RegiaoService] Erro ao criar região');
      throw error;
    }
  }

  /**
   * Atualiza o nome de uma região existente.
   * (Migração de services/regiaoService.js -> update)
   *
   * @param id - ID da região a atualizar
   * @param dto - Contém o novo 'nome'
   * @param empresaId - ID da empresa (do token JWT)
   * @returns A região atualizada.
   */
  async update(
    id: string | Types.ObjectId,
    dto: CreateRegiaoDto, // Reutiliza o DTO de criação
    empresaId: string | Types.ObjectId,
  ): Promise<IRegiao> {
    const { nome } = dto;
    logger.info(
      `[RegiaoService] Tentando atualizar região ${id} para nome '${nome}'.`,
    );

    // 1. Verifica se o *novo* nome já está em uso por *outra* região
    // (lógica do original)
    const existe = await this.regiaoRepo.findByName(nome, empresaId);
    if (existe && existe._id.toString() !== id.toString()) {
      throw new HttpError(
        `Já existe uma região com o nome '${nome}' na sua empresa.`,
        409, // Conflict
      );
    }

    // 2. Atualiza
    try {
      const regiaoAtualizada = await this.regiaoRepo.findByIdAndUpdate(
        id,
        empresaId,
        { nome },
      );

      if (!regiaoAtualizada) {
        throw new HttpError('Região não encontrada.', 404);
      }
      return regiaoAtualizada.toJSON();
    } catch (error: unknown) {
      // Fallback (race condition)
      if (error instanceof Error && (error as any).code === 11000) {
        throw new HttpError(
          `Já existe uma região com o nome '${nome}' na sua empresa.`,
          409,
        );
      }
      logger.error(error, `[RegiaoService] Erro ao atualizar região ${id}`);
      throw error;
    }
  }

  /**
   * Apaga uma região, verificando se não está em uso por placas.
   * (Migração de services/regiaoService.js -> delete)
   *
   * @param id - ID da região a apagar
   * @param empresaId - ID da empresa (do token JWT)
   */
  async delete(
    id: string | Types.ObjectId,
    empresaId: string | Types.ObjectId,
  ): Promise<{ success: boolean }> {
    logger.info(`[RegiaoService] Tentando apagar região ${id}.`);

    // 1. Verifica se alguma placa está a usar esta região
    // (lógica do original)
    const emUso = await this.placaRepo.checkRegiaoInUse(id, empresaId);
    if (emUso) {
      throw new HttpError(
        'Não é possível apagar esta região, pois está a ser utilizada por uma ou mais placas.',
        400, // Bad Request (ou 409 Conflict)
      );
    }

    // 2. Apaga a região
    const result = await this.regiaoRepo.deleteOne(id, empresaId);

    if (result.deletedCount === 0) {
      throw new HttpError('Região não encontrada.', 404);
    }

    logger.info(`[RegiaoService] Região ${id} apagada com sucesso.`);
    return { success: true };
  }
}

/**
 * Instância padrão (singleton) do serviço.
 */
export const regiaoService = new RegiaoService(
  regiaoRepository,
  placaRepository,
);