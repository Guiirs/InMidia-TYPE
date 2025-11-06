import { Types } from 'mongoose';
import path from 'path';
import { logger } from '@/config/logger';
import { HttpError } from '@/utils/errors/httpError';
import { storageService } from '@/utils/storage.service';

// Repositórios
import {
  clienteRepository,
  ClienteRepository,
} from '@/db/repositories/cliente.repository';
import {
  aluguelRepository,
  AluguelRepository,
} from '@/db/repositories/aluguel.repository';

// DTOs (Validators)
import {
  CreateClienteDto,
  UpdateClienteDto,
  ListClientesDto,
} from '@/utils/validators/cliente.validator';
import { ICliente } from '@/db/models/cliente.model';

/**
 * Serviço responsável pela lógica de negócios de Clientes.
 * (Migração de services/clienteService.js)
 */
export class ClienteService {
  constructor(
    private readonly clienteRepo: ClienteRepository,
    private readonly aluguelRepo: AluguelRepository,
    private readonly storage: typeof storageService,
  ) {}

  /**
   * Helper: Pega a data de hoje com horas zeradas (para comparações)
   */
  private getHoje(): Date {
    const hoje = new Date();
    hoje.setUTCHours(0, 0, 0, 0);
    return hoje;
  }

  /**
   * Cria um novo cliente.
   * (Migração de services/clienteService.js -> createCliente)
   */
  async createCliente(
    dto: CreateClienteDto,
    file: Express.Multer.File | undefined,
    empresaId: string | Types.ObjectId,
  ): Promise<ICliente> {
    logger.info(`[ClienteService] Tentando criar cliente para empresa ${empresaId}.`);

    const dadosParaSalvar: Omit<ICliente, 'createdAt' | 'updatedAt'> = {
      ...dto,
      empresa: new Types.ObjectId(empresaId),
      // Zod já tratou campos opcionais e CNPJ
      cnpj: dto.cnpj || null,
    };

    if (file) {
      logger.info(`[ClienteService] Ficheiro (logo) recebido: ${(file as any).key}`);
      // Multer-S3 anexa 'key', usamos basename (lógica do JS original)
      dadosParaSalvar.logo_url = path.basename((file as any).key);
    }

    try {
      const novoCliente = await this.clienteRepo.create(dadosParaSalvar);
      logger.info(
        `[ClienteService] Cliente ${novoCliente.nome} (ID: ${novoCliente.id}) criado.`,
      );
      return novoCliente.toJSON();
    } catch (error: unknown) {
      // Trata erro de duplicado (11000) (lógica do JS original)
      if (error instanceof Error && (error as any).code === 11000) {
        const keyValue = (error as any).keyValue;
        const campo = Object.keys(keyValue)[0]; // ex: 'cnpj' ou 'email'
        throw new HttpError(
          `Já existe um cliente com este ${campo} (${keyValue[campo]}) na sua empresa.`,
          409, // Conflict
        );
      }
      logger.error(error, '[ClienteService] Erro ao criar cliente');
      throw error;
    }
  }

  /**
   * Atualiza um cliente existente.
   * (Migração de services/clienteService.js -> updateCliente)
   */
  async updateCliente(
    id: string | Types.ObjectId,
    dto: UpdateClienteDto,
    file: Express.Multer.File | undefined,
    empresaId: string | Types.ObjectId,
  ): Promise<ICliente> {
    logger.info(`[ClienteService] Tentando atualizar cliente ID ${id}.`);

    // 1. Busca o cliente antigo (para saber o logo_url antigo)
    const clienteAntigo = await this.clienteRepo.findById(id, empresaId);
    if (!clienteAntigo) {
      throw new HttpError('Cliente não encontrado.', 404);
    }

    const dadosParaAtualizar: UpdateClienteDto = { ...dto };
    let imagemAntigaKey: string | undefined = clienteAntigo.logo_url;
    let deveApagarImagemAntiga = false;

    // 2. Lógica de tratamento da imagem (lógica do JS original)
    if (file) {
      // Se um novo ficheiro foi enviado, apaga o antigo
      dadosParaAtualizar.logo_url = path.basename((file as any).key);
      if (imagemAntigaKey) deveApagarImagemAntiga = true;
    } else if (dto.logo_url === '') {
      // Se o campo 'logo_url' foi enviado como string vazia, apaga a imagem
      dadosParaAtualizar.logo_url = undefined; // Remove do DB
      if (imagemAntigaKey) deveApagarImagemAntiga = true;
    } else {
      // Se 'logo_url' não está no DTO, mantém a imagem antiga
      delete dadosParaAtualizar.logo_url;
    }
    
    // 3. Trata CNPJ (lógica do JS original)
    if (dadosParaAtualizar.cnpj === '') {
        dadosParaAtualizar.cnpj = null;
    }

    // 4. Atualiza no repositório
    try {
      const clienteAtualizado = await this.clienteRepo.findByIdAndUpdate(
        id,
        empresaId,
        dadosParaAtualizar,
      );
      if (!clienteAtualizado) {
        throw new HttpError('Cliente não encontrado durante a atualização.', 404);
      }

      // 5. Apaga a imagem antiga do R2 (se necessário)
      if (deveApagarImagemAntiga && imagemAntigaKey) {
        logger.info(`[ClienteService] Deletando logo antigo: ${imagemAntigaKey}`);
        await this.storage.deleteFileFromR2(imagemAntigaKey, 'cliente_logo');
      }

      logger.info(`[ClienteService] Cliente ID ${id} atualizado.`);
      return clienteAtualizado.toJSON();
    } catch (error: unknown) {
      // Trata erro de duplicado (11000) (lógica do JS original)
      if (error instanceof Error && (error as any).code === 11000) {
        const keyValue = (error as any).keyValue;
        const campo = Object.keys(keyValue)[0];
        throw new HttpError(
          `Já existe outro cliente com este ${campo} (${keyValue[campo]}) na sua empresa.`,
          409,
        );
      }
      logger.error(error, `[ClienteService] Erro ao atualizar cliente ${id}`);
      throw error;
    }
  }

  /**
   * Busca todos os clientes (com paginação).
   * (Migração de services/clienteService.js -> getAllClientes)
   */
  async getAllClientes(
    empresaId: string | Types.ObjectId,
    dto: ListClientesDto,
  ) {
    logger.info(`[ClienteService] Buscando clientes para empresa ${empresaId}.`);
    
    // 1. Busca os dados paginados (Repo já usa lean() e sort())
    const { data, totalDocs } =
      await this.clienteRepo.findByEmpresaPaginated(empresaId, {
        page: dto.page,
        limit: dto.limit,
        sort: { nome: 1 }, // Lógica do JS original
      });

    // 2. Formata a paginação
    const limit = dto.limit || 1000;
    const page = dto.page || 1;
    const totalPages = Math.ceil(totalDocs / limit);
    const pagination = { totalDocs, totalPages, currentPage: page, limit };

    // 3. Retorna no formato esperado pelo frontend (data + pagination)
    return { data, pagination };
  }

  /**
   * Busca um cliente específico pelo ID.
   * (Migração de services/clienteService.js -> getClienteById)
   */
  async getClienteById(
    id: string | Types.ObjectId,
    empresaId: string | Types.ObjectId,
  ): Promise<ICliente> {
    const cliente = await this.clienteRepo.findById(id, empresaId);
    if (!cliente) {
      throw new HttpError('Cliente não encontrado.', 404);
    }
    return cliente.toJSON();
  }

  /**
   * Apaga um cliente, verificando se não está em uso por aluguéis.
   * (Migração de services/clienteService.js -> deleteCliente)
   */
  async deleteCliente(
    id: string | Types.ObjectId,
    empresaId: string | Types.ObjectId,
  ): Promise<{ success: boolean }> {
    logger.info(`[ClienteService] Tentando apagar cliente ID ${id}.`);

    // 1. Verifica se o cliente tem aluguéis ativos ou futuros
    // (lógica do JS original)
    const hoje = this.getHoje();
    const temAluguel = await this.aluguelRepo.checkClienteHasActiveAlugueis(
      id,
      empresaId,
      hoje,
    );

    if (temAluguel) {
      throw new HttpError(
        'Não é possível apagar um cliente com alugueis ativos ou agendados.',
        409, // Conflict (original usou 409)
      );
    }

    // 2. Apaga do DB
    const clienteApagado = await this.clienteRepo.findByIdAndDelete(id, empresaId);
    if (!clienteApagado) {
      throw new HttpError('Cliente não encontrado.', 404);
    }

    // 3. Apaga o logo do R2 (se existir)
    // (lógica do JS original)
    if (clienteApagado.logo_url) {
      await this.storage.deleteFileFromR2(clienteApagado.logo_url, 'cliente_logo');
    }

    logger.info(`[ClienteService] Cliente ${clienteApagado.nome} (ID: ${id}) apagado.`);
    return { success: true };
  }
}

/**
 * Instância padrão (singleton) do serviço.
 */
export const clienteService = new ClienteService(
  clienteRepository,
  aluguelRepository,
  storageService,
);