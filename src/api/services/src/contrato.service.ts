import { Response } from 'express';
import { Types } from 'mongoose';
import { logger } from '@/config/logger';
import { HttpError } from '@/utils/errors/httpError';

// Repositórios
import {
  contratoRepository,
  ContratoRepository,
} from '@/db/repositories/contrato.repository';
import {
  propostaInternaRepository,
  PropostaInternaRepository,
} from '@/db/repositories/propostaInterna.repository';
import {
  userRepository,
  UserRepository,
} from '@/db/repositories/user.repository'; // (Para o PDF)
import {
  empresaRepository,
  EmpresaRepository,
} from '@/db/repositories/empresa.repository'; // (Para o PDF)

// Serviços
import { pdfService, PdfService } from './pdf.service';

// DTOs e Tipos
import {
  CreateContratoDto,
  UpdateContratoDto,
  ListContratosDto,
} from '@/utils/validators/contrato.validator';
import { IContrato } from '@/db/models/contrato.model';

/**
 * Serviço responsável pela lógica de negócios de Contratos.
 * (Migração de services/contratoService.js)
 */
export class ContratoService {
  constructor(
    private readonly contratoRepo: ContratoRepository,
    private readonly piRepo: PropostaInternaRepository,
    private readonly userRepo: UserRepository,
    private readonly empresaRepo: EmpresaRepository,
    private readonly pdfGenService: PdfService,
  ) {}

  /**
   * Cria um Contrato a partir de uma PI.
   * (Migração de services/contratoService.js -> create)
   */
  async create(
    dto: CreateContratoDto,
    empresaId: string | Types.ObjectId,
  ): Promise<IContrato> {
    logger.info(`[ContratoService] Tentando criar contrato a partir da PI ${dto.piId}`);

    // 1. Verifica se a PI existe (lógica do JS)
    const pi = await this.piRepo.findOne({
      _id: dto.piId,
      empresa: empresaId,
    });
    if (!pi) {
      throw new HttpError('Proposta Interna (PI) não encontrada.', 404);
    }

    // 2. Verifica se já existe um contrato (lógica do JS)
    const existe = await this.contratoRepo.findOne({
      pi: dto.piId,
      empresa: empresaId,
    });
    if (existe) {
      throw new HttpError('Um contrato para esta PI já foi gerado.', 409);
    }

    // 3. Cria o contrato
    try {
      const novoContrato = await this.contratoRepo.create({
        pi: new Types.ObjectId(dto.piId),
        empresa: new Types.ObjectId(empresaId),
        cliente: pi.cliente, // Pega o cliente da PI
        status: 'rascunho', // Padrão
      });
      // O repositório já retorna o objeto populado
      return novoContrato.toJSON();
    } catch (error: unknown) {
      // Fallback (race condition 11000)
      if (error instanceof Error && (error as any).code === 11000) {
        throw new HttpError(
          'Um contrato para esta PI já foi gerado (Erro 11000).',
          409,
        );
      }
      logger.error(error, '[ContratoService] Erro ao criar contrato');
      throw error;
    }
  }

  /**
   * Lista todos os Contratos (com paginação e filtros).
   * (Migração de services/contratoService.js -> getAll)
   */
  async getAll(empresaId: string | Types.ObjectId, dto: ListContratosDto) {
    logger.info(`[ContratoService] Listando contratos para empresa ${empresaId}.`);

    const { data, totalDocs, totalPages } =
      await this.contratoRepo.findPaginatedByQuery(empresaId, dto);

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
   * Busca um Contrato pelo ID (com populações completas para PDF/Get).
   * (Migração de services/contratoService.js -> getById)
   */
  async getById(
    contratoId: string | Types.ObjectId,
    empresaId: string | Types.ObjectId,
  ): Promise<IContrato> {
    logger.debug(`[ContratoService] Buscando Contrato ${contratoId}.`);
    // O repositório já faz todo o populate complexo (empresa, pi, pi.cliente)
    const contrato = await this.contratoRepo.findById(contratoId, empresaId);

    if (!contrato) {
      throw new HttpError('Contrato não encontrado.', 404);
    }

    // Validação extra (lógica do JS)
    if (!contrato.pi || !contrato.cliente || !contrato.empresa) {
      throw new HttpError(
        'Dados associados ao contrato (PI, Cliente ou Empresa) não foram encontrados.',
        404,
      );
    }

    return contrato.toJSON();
  }

  /**
   * Atualiza um Contrato (apenas o status).
   * (Migração de services/contratoService.js -> update)
   */
  async update(
    contratoId: string | Types.ObjectId,
    dto: UpdateContratoDto,
    empresaId: string | Types.ObjectId,
  ): Promise<IContrato> {
    logger.info(`[ContratoService] Atualizando Contrato ${contratoId}.`);

    // A segurança (Mass Assignment) é garantida pelo DTO Zod ('strict()')
    //
    
    const contratoAtualizado = await this.contratoRepo.findByIdAndUpdate(
      contratoId,
      empresaId,
      dto,
    );

    if (!contratoAtualizado) {
      throw new HttpError('Contrato não encontrado.', 404);
    }
    return contratoAtualizado.toJSON();
  }

  /**
   * Deleta um Contrato (se estiver em 'rascunho').
   * (Migração de services/contratoService.js -> delete)
   */
  async delete(
    contratoId: string | Types.ObjectId,
    empresaId: string | Types.ObjectId,
  ): Promise<{ success: boolean }> {
    logger.info(`[ContratoService] Tentando deletar Contrato ${contratoId}.`);

    // 1. Verifica se o contrato está em 'rascunho'
    // (lógica do JS)
    const contrato = await this.contratoRepo.findOne({
      _id: contratoId,
      empresa: empresaId,
    });

    if (!contrato) {
      throw new HttpError('Contrato não encontrado.', 404);
    }
    if (contrato.status !== 'rascunho') {
      throw new HttpError(
        'Não é possível deletar um contrato que já está ativo, concluído ou cancelado.',
        400, // Bad Request
      );
    }

    // 2. Deleta o contrato
    await this.contratoRepo.deleteOne(contratoId, empresaId);
    return { success: true };
  }

  /**
   * Gera e envia o PDF do Contrato.
   * (Migração de services/contratoService.js -> generatePDF)
   */
  async generatePDF(
    contratoId: string | Types.ObjectId,
    empresaId: string | Types.ObjectId,
    userId: string | Types.ObjectId, // (Adicionado userId, que faltava no JS original)
    res: Response,
  ) {
    logger.debug(`[ContratoService] Gerando PDF para Contrato ${contratoId}.`);

    // 1. Busca o contrato (já vem com PI, PI.Cliente e Empresa populados)
    const contrato = await this.contratoRepo.findById(contratoId, empresaId);
    if (!contrato) throw new HttpError('Contrato não encontrado.', 404);

    // 2. Busca o usuário que está gerando
    const user = await this.userRepo.findById(userId);
    if (!user) throw new HttpError('Usuário gerador não encontrado.', 404);

    // 3. Chama o serviço de PDF (extrai os objetos populados)
    const pi: any = contrato.pi;
    const cliente: any = pi.cliente;
    const empresa: any = contrato.empresa;

    this.pdfGenService.generateContrato_PDF(
      res,
      contrato.toJSON(),
      pi.toJSON(),
      cliente.toJSON(),
      empresa.toJSON(),
      user.toJSON(), // Passa o usuário que gerou
    );
  }
}

/**
 * Instância padrão (singleton) do serviço.
 */
export const contratoService = new ContratoService(
  contratoRepository,
  propostaInternaRepository,
  userRepository,
  empresaRepository,
  pdfService,
);