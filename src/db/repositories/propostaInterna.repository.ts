/*
 * Arquivo: /db/repositories/propostaInterna.repository.ts
 *
 * Resumo das Alterações:
 * 1. Importações atualizadas para usar os novos tipos de modelo (PropostaInternaDocument, PropostaInternaModel, IPropostaInterna).
 * 2. Tipos de retorno ajustados para diferenciar Documentos Mongoose (Hydrated) de objetos Lean (POJO).
 *
 * Motivo das Mudanças:
 * Funções com `.lean()` (findOne, findPaginatedByQuery) foram tipadas para
 * retornar a interface base `IPropostaInterna` (POJO) em vez de `PropostaInternaDocument`.
 * Funções que retornam documentos completos (create, findById) usam `PropostaInternaDocument`
 * para resolver os erros de `FlattenMaps`.
 */

import {
  PropostaInternaModel,
  PropostaInternaDocument, // Importa o tipo HydratedDocument
  IPropostaInterna, // Importa a interface base (POJO)
  StatusPI,
} from '@/db/models/propostaInterna.model';
import { FilterQuery, Types, UpdateQuery } from 'mongoose';

// Tipagem para os filtros de paginação (baseado em piService.getAll)
interface IPiQueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
  status?: StatusPI;
  clienteId?: string;
}

/**
 * Repositório para abstrair as operações de banco de dados do modelo PropostaInterna.
 */
export class PropostaInternaRepository {
  constructor(private readonly piModel: PropostaInternaModel) {}

  /**
   * Cria uma nova Proposta Interna.
   * @param piData - Dados da nova PI
   * @returns O documento da PI criada (com cliente e placas populados).
   */
  async create(
    piData: Omit<IPropostaInterna, 'createdAt' | 'updatedAt'>,
  ): Promise<PropostaInternaDocument> {
    const [createdPI] = await this.piModel.create([piData]);
    // Popula o retorno (replicando piService.create)
    return createdPI.populate([
      {
        path: 'cliente',
        select: 'nome email telefone cnpj responsavel segmento',
      },
      { path: 'placas', select: 'numero_placa' }, // 'codigo' no JS, 'numero_placa' no TS
    ]);
  }

  /**
   * Encontra uma PI pelo ID e empresa, com populações completas.
   * (Usado pelo piService.getById e generatePDF)
   * @param id - ID da PI
   * @param empresaId - ID da empresa proprietária
   * @returns O documento da PI (com cliente e placas/regiões) ou null.
   */
  async findById(
    id: string | Types.ObjectId,
    empresaId: string | Types.ObjectId,
  ): Promise<PropostaInternaDocument | null> {
    return this.piModel
      .findOne({ _id: id, empresa: empresaId })
      .populate('cliente') // População completa do cliente
      .populate({
        path: 'placas', // Popula placas
        select: 'numero_placa regiao', // 'codigo' no JS, 'numero_placa' no TS
        populate: { path: 'regiao', select: 'nome' }, // Popula região dentro da placa
      })
      .exec();
  }

  /**
   * Encontra uma PI por um filtro específico (ex: para verificar contrato).
   * @param filter - Filtro Mongoose
   * @returns O documento da PI (POJO) ou null.
   */
  async findOne(
    filter: FilterQuery<PropostaInternaDocument>,
  ): Promise<IPropostaInterna | null> {
    // Correção: .lean() retorna a interface base (IPropostaInterna)
    return this.piModel.findOne(filter).lean().exec();
  }

  /**
   * Atualiza uma PI pelo ID e empresa.
   * @param id - ID da PI
   * @param empresaId - ID da empresa proprietária
   * @param updateData - Dados a serem atualizados
   * @returns O documento da PI atualizada (com cliente/placas) ou null.
   */
  async findByIdAndUpdate(
    id: string | Types.ObjectId,
    empresaId: string | Types.ObjectId,
    updateData: UpdateQuery<IPropostaInterna>,
  ): Promise<PropostaInternaDocument | null> {
    return this.piModel
      .findOneAndUpdate({ _id: id, empresa: empresaId }, { $set: updateData }, {
        new: true,
        runValidators: true,
      })
      .populate([
        { path: 'cliente', select: 'nome email' }, // Popula o necessário
        { path: 'placas', select: 'numero_placa' },
      ])
      .exec();
  }

  /**
   * Deleta uma PI pelo ID e empresa.
   * @param id - ID da PI
   * @param empresaId - ID da empresa proprietária
   * @returns O resultado da operação de deleção.
   */
  async deleteOne(
    id: string | Types.ObjectId,
    empresaId: string | Types.ObjectId,
  ) {
    return this.piModel.deleteOne({ _id: id, empresa: empresaId }).exec();
  }

  /**
   * Busca PIs com paginação, filtros e ordenação.
   * (Baseado no getAll do piService.js)
   *
   * @param empresaId - ID da empresa
   * @param options - Opções de consulta (filtros, paginação, etc.)
   * @returns Objeto com os dados paginados (POJOs) e a contagem total.
   */
  async findPaginatedByQuery(
    empresaId: string | Types.ObjectId,
    options: IPiQueryOptions,
  ): Promise<{ data: IPropostaInterna[]; totalDocs: number; totalPages: number }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'desc',
      status,
      clienteId,
    } = options;

    const skip = (page - 1) * limit;
    const sortOrder = order === 'desc' ? -1 : 1;
    const camposOrdenaveis = [
      'createdAt',
      'updatedAt',
      'dataInicio',
      'dataFim',
      'valorTotal',
      'status',
    ];
    const campoOrdenacaoFinal = camposOrdenaveis.includes(sortBy)
      ? sortBy
      : 'createdAt';

    // Constrói a query (replicando lógica do piService.js)
    const query: FilterQuery<PropostaInternaDocument> = { empresa: empresaId };

    if (status) query.status = status;
    if (clienteId) query.cliente = clienteId;

    // Executa as queries em paralelo
    const [totalDocs, data] = await Promise.all([
      this.piModel.countDocuments(query),
      this.piModel
        .find(query)
        .select(
          'cliente tipoPeriodo dataInicio dataFim valorTotal status formaPagamento placas descricao',
        )
        .populate('cliente', 'nome responsavel segmento') // Popula cliente
        .sort({ [campoOrdenacaoFinal]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean() // Retorna POJOs -> IPropostaInterna[]
        .exec(),
    ]);

    return { data, totalDocs, totalPages: Math.ceil(totalDocs / limit) };
  }

  /**
   * Atualiza o status de PIs vencidas (para o Cron Job).
   * (Baseado no updateStatusJob.js e piService.js)
   * @param hoje - Data de hoje
   */
  async updateVencidas(hoje: Date) {
    return this.piModel.updateMany(
      {
        status: 'em_andamento',
        dataFim: { $lt: hoje },
      },
      { $set: { status: 'vencida' } },
    );
  }

  /**
   * Retorna uma lista de IDs de placas que estão ocupadas em PIs (em andamento/concluídas)
   * em um determinado período.
   * (Usado pelo placaService.getPlacasDisponiveis)
   * @param empresaId - ID da empresa
   * @param inicio - Data de início
   * @param fim - Data de fim
   * @returns Array de ObjectIds (placa IDs)
   */
  async findOverlappingPlacaIds(
    empresaId: string | Types.ObjectId,
    inicio: Date,
    fim: Date,
  ): Promise<Types.ObjectId[]> {
    // .lean() retorna (Pick<IPropostaInterna, 'placas'> & { _id: ... })[]
    const results = await this.piModel
      .find({
        empresa: empresaId,
        status: { $in: ['em_andamento', 'concluida'] }, // Replicando lógica JS
        dataInicio: { $lt: fim },
        dataFim: { $gt: inicio },
      })
      .select('placas')
      .lean()
      .exec();

    // Mapeia e achata o array de arrays de ObjectIds
    // (O tipo de `placas` em IPropostaInterna é (Types.ObjectId | IPlaca)[])
    // Após .lean(), será (Types.ObjectId | IPlaca)[], mas como selecionamos
    // apenas 'placas', serão ObjectIds.
    return results.flatMap((pi) => pi.placas as Types.ObjectId[]);
  }
}

/**
 * Instância padrão (singleton) do repositório.
 */
export const propostaInternaRepository = new PropostaInternaRepository(
  PropostaInternaModel,
);