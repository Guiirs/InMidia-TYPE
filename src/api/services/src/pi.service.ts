import { Response } from 'express';
import { Types } from 'mongoose';
import { logger } from '@/config/logger';
import { HttpError } from '@/utils/errors/httpError';

// Repositórios
import {
  propostaInternaRepository,
  PropostaInternaRepository,
} from '@/db/repositories/propostaInterna.repository';
import {
  clienteRepository,
  ClienteRepository,
} from '@/db/repositories/cliente.repository';
import {
  userRepository,
  UserRepository,
} from '@/db/repositories/user.repository';
import {
  empresaRepository,
  EmpresaRepository,
} from '@/db/repositories/empresa.repository';

// Serviços
import { pdfService, PdfService } from './src/pdf.service';

// DTOs e Tipos
import {
  CreatePiDto,
  UpdatePiDto,
  ListPisDto,
} from '@/utils/validators/pi.validator';
import { IPropostaInterna } from '@/db/models/propostaInterna.model';

/**
 * Serviço responsável pela lógica de negócios de Propostas Internas (PIs).
 * (Migração de services/piService.js)
 */
export class PiService {
  constructor(
    private readonly piRepo: PropostaInternaRepository,
    private readonly clienteRepo: ClienteRepository,
    private readonly userRepo: UserRepository,
    private readonly empresaRepo: EmpresaRepository,
    private readonly pdfGenService: PdfService,
  ) {}

  /**
   * Valida se o cliente pertence à empresa.
   * (Migração do helper _validateCliente)
   */
  private async _validateCliente(
    clienteId: string | Types.ObjectId,
    empresaId: string | Types.ObjectId,
  ) {
    const cliente = await this.clienteRepo.findById(clienteId, empresaId);
    if (!cliente) {
      throw new HttpError(
        'Cliente não encontrado ou não pertence à sua empresa.',
        404,
      );
    }
    return cliente;
  }

  /**
   * Cria uma nova PI.
   * (Migração de services/piService.js -> create)
   */
  async create(
    dto: CreatePiDto,
    empresaId: string | Types.ObjectId,
  ): Promise<IPropostaInterna> {
    logger.info(`[PiService] Tentando criar PI para empresa ${empresaId}.`);

    // 1. Valida o cliente
    await this._validateCliente(dto.clienteId, empresaId);

    // 2. Cria a PI
    const novaPI = await this.piRepo.create({
      ...dto,
      cliente: new Types.ObjectId(dto.clienteId),
      empresa: new Types.ObjectId(empresaId),
      status: 'em_andamento', // Garante o status inicial
      // O DTO já lida com datas, placas, formaPagamento, etc.
    });

    // O repositório já retorna o objeto populado
    return novaPI.toJSON();
  }

  /**
   * Busca uma PI pelo ID (com populações completas para PDF/Get).
   * (Migração de services/piService.js -> getById)
   */
  async getById(
    piId: string | Types.ObjectId,
    empresaId: string | Types.ObjectId,
  ): Promise<IPropostaInterna> {
    logger.debug(`[PiService] Buscando PI ${piId} (Empresa ${empresaId}).`);
    const pi = await this.piRepo.findById(piId, empresaId);

    if (!pi) {
      throw new HttpError('Proposta Interna (PI) não encontrada.', 404);
    }
    return pi.toJSON();
  }

  /**
   * Lista todas as PIs (com paginação e filtros).
   * (Migração de services/piService.js -> getAll)
   */
  async getAll(empresaId: string | Types.ObjectId, dto: ListPisDto) {
    logger.info(`[PiService] Listando PIs para empresa ${empresaId}.`);

    const { data, totalDocs, totalPages } =
      await this.piRepo.findPaginatedByQuery(empresaId, dto);

    // Formata a paginação
    const pagination = {
      totalDocs,
      totalPages,
      currentPage: dto.page || 1,
      limit: dto.limit || 10,
    };

    return { data, pagination };
  }

  /**
   * Atualiza uma PI.
   * (Migração de services/piService.js -> update)
   */
  async update(
    piId: string | Types.ObjectId,
    dto: UpdatePiDto,
    empresaId: string | Types.ObjectId,
  ): Promise<IPropostaInterna> {
    logger.info(`[PiService] Atualizando PI ${piId} (Empresa ${empresaId}).`);

    // 1. Valida o cliente (se ele for alterado)
    if (dto.clienteId) {
      await this._validateCliente(dto.clienteId, empresaId);
    }

    // 2. Correção de Segurança (Mass Assignment)
    // Apenas os campos definidos no DTO (UpdatePiDto) são passados
    // para o repositório. Campos como 'status' ou 'empresa' não podem ser
    // injetados pelo DTO.
    const dadosParaAtualizar = {
      ...dto,
      cliente: dto.clienteId ? new Types.ObjectId(dto.clienteId) : undefined,
    };
    // Remove o clienteId antigo para evitar confusão no $set
    delete (dadosParaAtualizar as any).clienteId;

    // 3. Atualiza
    const piAtualizada = await this.piRepo.findByIdAndUpdate(
      piId,
      empresaId,
      dadosParaAtualizar,
    );

    if (!piAtualizada) {
      throw new HttpError('PI não encontrada.', 404);
    }

    return piAtualizada.toJSON();
  }

  /**
   * Deleta uma PI.
   * (Migração de services/piService.js -> delete)
   */
  async delete(
    piId: string | Types.ObjectId,
    empresaId: string | Types.ObjectId,
  ): Promise<{ success: boolean }> {
    logger.info(`[PiService] Deletando PI ${piId} (Empresa ${empresaId}).`);
    
    // (Lógica de verificar contrato pendente do JS original)
    // TODO: Adicionar verificação no 'contratoRepository' quando ele existir.
    // const contrato = await this.contratoRepo.findOne({ pi: piId, empresa: empresaId });
    // if (contrato) {
    //   throw new HttpError('Não é possível apagar uma PI que já gerou um contrato.', 400);
    // }

    const result = await this.piRepo.deleteOne(piId, empresaId);

    if (result.deletedCount === 0) {
      throw new HttpError('PI não encontrada.', 404);
    }
    return { success: true };
  }

  /**
   * Gera e envia o PDF da PI.
   * (Migração de services/piService.js -> generatePDF)
   */
  async generatePDF(
    piId: string | Types.ObjectId,
    empresaId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
    res: Response,
  ) {
    logger.debug(`[PiService] Gerando PDF para PI ${piId}.`);

    // 1. Buscar todos os dados (PI já vem 100% populada pelo repo)
    // (Lógica do JS original)
    const pi = await this.piRepo.findById(piId, empresaId);
    if (!pi) throw new HttpError('PI não encontrada.', 404);
    
    // (O .findById do repo já popula pi.cliente e pi.placas.regiao)

    const [empresa, user] = await Promise.all([
      this.empresaRepo.findById(empresaId), // Busca dados da empresa
      this.userRepo.findById(userId),       // Busca dados do usuário (criador)
    ]);

    if (!empresa) throw new HttpError('Dados da empresa não encontrados.', 404);
    if (!user) throw new HttpError('Dados do usuário não encontrados.', 404);

    // 2. Chamar o serviço de PDF
    // (Usamos .toJSON() para garantir que os dados populados sejam POJOs)
    this.pdfGenService.generatePI_PDF(
      res,
      pi.toJSON() as any, // Cast para o tipo complexo esperado pelo PDF
      pi.cliente.toJSON(),
      empresa.toJSON(),
      user.toJSON(),
    );
  }

  /**
   * [PARA O CRON JOB] Atualiza o status de PIs vencidas.
   * (Migração de services/piService.js -> updateVencidas [static])
   */
  async updateVencidas(): Promise<void> {
    const hoje = new Date();
    logger.info(`[PiService-Cron] Verificando PIs vencidas (Data: ${hoje.toISOString()}).`);
    
    try {
      const result = await this.piRepo.updateVencidas(hoje);
      if (result.modifiedCount > 0) {
        logger.info(
          `[PiService-Cron] ${result.modifiedCount} PIs foram atualizadas para 'vencida'.`,
        );
      }
    } catch (error) {
       logger.error(error, `[PiService-Cron] Erro ao atualizar status de PIs vencidas:`);
    }
  }
}

/**
 * Instância padrão (singleton) do serviço.
 */
export const piService = new PiService(
  propostaInternaRepository,
  clienteRepository,
  userRepository,
  empresaRepository,
  pdfService,
);