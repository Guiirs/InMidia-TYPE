import { Types } from 'mongoose';
import path from 'path';
import { logger } from '@/config/logger';
import { HttpError } from '@/utils/errors/httpError';
import { storageService } from '@/utils/storage.service';

// Repositórios
import {
  placaRepository,
  PlacaRepository,
} from '@/db/repositories/placa.repository';
import {
  regiaoRepository,
  RegiaoRepository,
} from '@/db/repositories/regiao.repository';
import {
  aluguelRepository,
  AluguelRepository,
} from '@/db/repositories/aluguel.repository';
import {
  propostaInternaRepository,
  PropostaInternaRepository,
} from '@/db/repositories/propostaInterna.repository';

// DTOs (Validators)
import {
  CreatePlacaDto,
  UpdatePlacaDto,
  ListPlacasDto,
  CheckDisponibilidadeDto,
} from '@/utils/validators/placa.validator';
import { IPlaca, IPlacaDocument } from '@/db/models/placa.model';

/**
 * Serviço responsável pela lógica de negócios de Placas (Mídia OOH).
 * (Migração de services/placaService.js)
 */
export class PlacaService {
  constructor(
    private readonly placaRepo: PlacaRepository,
    private readonly regiaoRepo: RegiaoRepository,
    private readonly aluguelRepo: AluguelRepository,
    private readonly piRepo: PropostaInternaRepository,
    private readonly storage: typeof storageService,
  ) {}

  /**
   * Helper: Pega a data de hoje com horas zeradas (para comparações de aluguel)
   */
  private getHoje(): Date {
    const hoje = new Date();
    hoje.setUTCHours(0, 0, 0, 0);
    return hoje;
  }

  /**
   * Cria uma nova placa.
   * (Migração de services/placaService.js -> createPlaca)
   */
  async createPlaca(
    dto: CreatePlacaDto,
    file: Express.Multer.File | undefined,
    empresaId: string | Types.ObjectId,
  ): Promise<IPlaca> {
    logger.info(`[PlacaService] Tentando criar placa para empresa ${empresaId}.`);
    
    // 1. Validação de região (lógica do JS original)
    const regiaoExistente = await this.regiaoRepo.findById(
      dto.regiao,
      empresaId,
    );
    if (!regiaoExistente) {
      throw new HttpError(
        `Região ID ${dto.regiao} inválida ou não pertence à empresa.`,
        404, // Not Found (ou 400 Bad Request)
      );
    }

    // 2. Prepara dados para salvar
    const dadosParaSalvar: Omit<IPlaca, 'createdAt' | 'updatedAt' | 'disponivel'> = {
      ...dto,
      empresa: new Types.ObjectId(empresaId),
      regiao: new Types.ObjectId(dto.regiao),
      // Zod já tratou campos opcionais (coordenadas, etc.)
    };

    if (file) {
      logger.info(`[PlacaService] Ficheiro recebido: ${(file as any).key}`);
      // Multer-S3 anexa 'key' (o path completo), usamos basename para pegar só o nome
      dadosParaSalvar.imagem = path.basename((file as any).key);
    }

    // 3. Cria no repositório
    try {
      const novaPlaca = await this.placaRepo.create(dadosParaSalvar);
      logger.info(
        `[PlacaService] Placa ${novaPlaca.numero_placa} (ID: ${novaPlaca.id}) criada.`,
      );
      return novaPlaca.toJSON();
    } catch (error: unknown) {
      // Trata erro de duplicado (11000)
      if (error instanceof Error && (error as any).code === 11000) {
        throw new HttpError(
          `Já existe uma placa com o número '${dto.numero_placa}' nesta região.`,
          409,
        );
      }
      logger.error(error, '[PlacaService] Erro ao criar placa');
      throw error;
    }
  }

  /**
   * Atualiza uma placa existente.
   * (Migração de services/placaService.js -> updatePlaca)
   */
  async updatePlaca(
    id: string | Types.ObjectId,
    dto: UpdatePlacaDto,
    file: Express.Multer.File | undefined,
    empresaId: string | Types.ObjectId,
  ): Promise<IPlaca> {
    logger.info(`[PlacaService] Tentando atualizar placa ID ${id}.`);

    // 1. Busca a placa antiga
    const placaAntiga = await this.placaRepo.findById(id, empresaId);
    if (!placaAntiga) {
      throw new HttpError('Placa não encontrada.', 404);
    }

    const dadosParaAtualizar: UpdateQuery<IPlacaDocument> = { ...dto };
    let imagemAntigaKey: string | undefined = placaAntiga.imagem;
    let deveApagarImagemAntiga = false;

    // 2. Lógica de tratamento da imagem (lógica do JS original)
    if (file) {
      // Se um novo ficheiro foi enviado, apaga o antigo (se existir)
      dadosParaAtualizar.imagem = path.basename((file as any).key);
      if (imagemAntigaKey) {
        deveApagarImagemAntiga = true;
      }
    } else if (dto.imagem === '') {
      // Se o campo 'imagem' foi enviado como string vazia, apaga a imagem
      dadosParaAtualizar.imagem = undefined; // Remove do DB
      if (imagemAntigaKey) {
        deveApagarImagemAntiga = true;
      }
    } else {
      // Se 'imagem' não está no DTO, mantém a imagem antiga
      delete dadosParaAtualizar.imagem;
    }

    // 3. Validação de região (se foi alterada)
    if (dto.regiao && dto.regiao.toString() !== placaAntiga.regiao._id.toString()) {
      const regiaoExistente = await this.regiaoRepo.findById(
        dto.regiao,
        empresaId,
      );
      if (!regiaoExistente) {
        throw new HttpError(
          `Região ID ${dto.regiao} inválida ou não pertence à empresa.`,
          404,
        );
      }
    }

    // 4. Atualiza no repositório
    try {
      const placaAtualizada = await this.placaRepo.findByIdAndUpdate(
        id,
        empresaId,
        dadosParaAtualizar,
      );
      if (!placaAtualizada) {
        throw new HttpError('Placa não encontrada durante a atualização.', 404);
      }

      // 5. Apaga a imagem antiga do R2 (se necessário)
      if (deveApagarImagemAntiga && imagemAntigaKey) {
        logger.info(`[PlacaService] Deletando imagem antiga: ${imagemAntigaKey}`);
        // O storageService já trata o erro (não crítico)
        await this.storage.deleteFileFromR2(imagemAntigaKey, 'placa');
      }

      logger.info(`[PlacaService] Placa ID ${id} atualizada com sucesso.`);
      return placaAtualizada.toJSON();
    } catch (error: unknown) {
      // Trata erro de duplicado (11000)
      if (error instanceof Error && (error as any).code === 11000) {
        throw new HttpError(
          `Já existe uma placa com o número '${dto.numero_placa || placaAntiga.numero_placa}' nesta região.`,
          409,
        );
      }
      logger.error(error, `[PlacaService] Erro ao atualizar placa ${id}`);
      throw error;
    }
  }

  /**
   * Busca todas as placas (com filtros, paginação).
   * (Migração de services/placaService.js -> getAllPlacas)
   */
  async getAllPlacas(
    empresaId: string | Types.ObjectId,
    dto: ListPlacasDto,
  ) {
    logger.info(`[PlacaService] Buscando placas para empresa ${empresaId}.`);
    
    // 1. Busca os dados paginados
    const { data, totalDocs, totalPages } =
      await this.placaRepo.findPaginatedByQuery(empresaId, dto);

    // 2. Lógica de agregação (buscar cliente_nome)
    const hoje = this.getHoje();
    const placaIds = data.map((p) => p._id);

    const alugueisAtivos = await this.aluguelRepo.findActiveByPlacaIds(
      placaIds,
      empresaId,
      hoje,
    );

    // Mapeia os aluguéis por placaId para busca rápida
    const aluguelMap = new Map<string, { cliente_nome?: string; data_fim?: Date }>();
    for (const aluguel of alugueisAtivos) {
      // Garante que o cliente foi populado e tem nome
      const clienteNome = (aluguel.cliente as any)?.nome || 'Cliente Desconhecido';
      aluguelMap.set(aluguel.placa.toString(), {
        cliente_nome: clienteNome,
        data_fim: aluguel.data_fim,
      });
    }

    // 3. Mapeia os resultados (convertendo para JSON e adicionando dados)
    const placasCompletas = data.map((placa) => {
      const placaJson = placa.toJSON();
      const aluguel = aluguelMap.get(placaJson.id);
      if (aluguel) {
        (placaJson as any).cliente_nome = aluguel.cliente_nome;
        (placaJson as any).aluguel_data_fim = aluguel.data_fim;
      }
      return placaJson;
    });

    return {
      data: placasCompletas,
      pagination: {
        totalDocs,
        totalPages,
        currentPage: dto.page || 1,
        limit: dto.limit || 10,
      },
    };
  }

  /**
   * Busca uma placa específica pelo ID.
   * (Migração de services/placaService.js -> getPlacaById)
   */
  async getPlacaById(
    id: string | Types.ObjectId,
    empresaId: string | Types.ObjectId,
  ): Promise<IPlaca> {
    const placa = await this.placaRepo.findById(id, empresaId);
    if (!placa) {
      throw new HttpError('Placa não encontrada.', 404);
    }

    const placaJson = placa.toJSON();

    // Lógica (JS original)
    if (!placaJson.disponivel) {
      const hoje = this.getHoje();
      const aluguelAtivo = await this.aluguelRepo.findActiveByPlaca(
        id,
        empresaId,
        hoje,
      );
      if (aluguelAtivo) {
        (placaJson as any).cliente_nome = (aluguelAtivo.cliente as any)?.nome || 'Cliente Desconhecido';
        (placaJson as any).aluguel_data_fim = aluguelAtivo.data_fim;
      } else {
        (placaJson as any).status_manutencao = true;
      }
    }
    return placaJson;
  }

  /**
   * Apaga uma placa.
   * (Migração de services/placaService.js -> deletePlaca)
   */
  async deletePlaca(
    id: string | Types.ObjectId,
    empresaId: string | Types.ObjectId,
  ): Promise<{ success: boolean }> {
    logger.info(`[PlacaService] Tentando apagar placa ID ${id}.`);

    // 1. Verifica se está alugada hoje (lógica do JS)
    const hoje = this.getHoje();
    const aluguelAtivo = await this.aluguelRepo.findActiveByPlaca(
      id,
      empresaId,
      hoje,
    );

    if (aluguelAtivo) {
      throw new HttpError(
        'Não é possível apagar uma placa que está atualmente alugada.',
        409, // Conflict
      );
    }

    // 2. Apaga do DB
    const placaApagada = await this.placaRepo.findByIdAndDelete(id, empresaId);
    if (!placaApagada) {
      throw new HttpError('Placa não encontrada.', 404);
    }

    // 3. Apaga a imagem do R2 (se existir)
    if (placaApagada.imagem) {
      await this.storage.deleteFileFromR2(placaApagada.imagem, 'placa');
    }

    logger.info(`[PlacaService] Placa ${placaApagada.numero_placa} (ID: ${id}) apagada.`);
    return { success: true };
  }

  /**
   * Alterna a disponibilidade (manutenção).
   * (Migração de services/placaService.js -> toggleDisponibilidade)
   */
  async toggleDisponibilidade(
    id: string | Types.ObjectId,
    empresaId: string | Types.ObjectId,
  ): Promise<IPlaca> {
    const placa = await this.placaRepo.findById(id, empresaId);
    if (!placa) {
      throw new HttpError('Placa não encontrada.', 404);
    }

    // Se a placa está disponível (e vai para manutenção)
    if (placa.disponivel) {
      // Verifica se está alugada hoje (lógica do JS)
      const hoje = this.getHoje();
      const aluguelAtivo = await this.aluguelRepo.findActiveByPlaca(
        id,
        empresaId,
        hoje,
      );
      if (aluguelAtivo) {
        throw new HttpError(
          'Não é possível colocar uma placa alugada em manutenção.',
          409, // Conflict
        );
      }
    }

    // Alterna o status e salva
    placa.disponivel = !placa.disponivel;
    const placaAtualizada = await this.placaRepo.save(placa);

    logger.info(
      `[PlacaService] Disponibilidade da placa ${id} alternada para ${placaAtualizada.disponivel}.`,
    );
    // Retorna o documento já populado (o findById já popula)
    return placaAtualizada.toJSON();
  }

  /**
   * Busca todas as localizações de placas (para o mapa).
   * (Migração de services/placaService.js -> getAllPlacaLocations)
   */
  async getAllPlacaLocations(empresaId: string | Types.ObjectId) {
    logger.info(`[PlacaService] Buscando localizações para empresa ${empresaId}.`);
    const locations = await this.placaRepo.findLocations(empresaId);
    // O repo já retorna POJO, apenas retornamos os dados
    return locations;
  }

  /**
   * Busca placas que NÃO ESTÃO em PIs ou Alugueis no período e estão disponíveis.
   * (Migração de services/placaService.js -> getPlacasDisponiveis)
   */
  async getPlacasDisponiveis(
    empresaId: string | Types.ObjectId,
    dto: CheckDisponibilidadeDto,
  ): Promise<IPlaca[]> {
    logger.info(
      `[PlacaService] Buscando placas disponíveis de ${dto.dataInicio} a ${dto.dataFim}.`,
    );

    const startDate = new Date(dto.dataInicio);
    const endDate = new Date(dto.dataFim);

    // 1. Encontrar IDs de placas em Alugueis que conflitam
    const idsAlugadas = await this.aluguelRepo.findOverlappingPlacaIds(
      empresaId,
      startDate,
      endDate,
    );

    // 2. Encontrar IDs de placas em PIs que conflitam
    const idsEmPI = await this.piRepo.findOverlappingPlacaIds(
      empresaId,
      startDate,
      endDate,
    );

    // 3. Juntar todos os IDs ocupados (Set remove duplicatas)
    const placasOcupadasIds = [
      ...new Set([...idsAlugadas.map(String), ...idsEmPI.map(String)]),
    ].map((id) => new Types.ObjectId(id));

    logger.debug(
      `[PlacaService] ${placasOcupadasIds.length} placas ocupadas no período.`,
    );

    // 4. Montar a query final (lógica do JS)
    const finalQuery: FilterQuery<IPlacaDocument> = {
      empresa: empresaId,
      disponivel: true, // Placa não deve estar em manutenção
      _id: { $nin: placasOcupadasIds }, // Não pode estar nos IDs ocupados
    };

    // 5. Adiciona filtros (regiao, search) (lógica do JS)
    if (dto.regiao) {
      finalQuery.regiao = new Types.ObjectId(dto.regiao);
    }
    if (dto.search) {
      const searchRegex = new RegExp(dto.search.trim(), 'i');
      finalQuery.$or = [
        { numero_placa: searchRegex },
        { nomeDaRua: searchRegex },
      ];
    }

    // 6. Busca no repositório
    const placasDisponiveis =
      await this.placaRepo.findDisponiveisByQuery(finalQuery);

    logger.info(
      `[PlacaService] Encontradas ${placasDisponiveis.length} placas disponíveis.`,
    );
    return placasDisponiveis;
  }
}

/**
 * Instância padrão (singleton) do serviço.
 */
export const placaService = new PlacaService(
  placaRepository,
  regiaoRepository,
  aluguelRepository,
  propostaInternaRepository,
  storageService,
);