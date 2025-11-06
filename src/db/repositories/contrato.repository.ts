/*
 * Arquivo: /db/repositories/contrato.repository.ts
 *
 * Resumo das Alterações:
 * 1. Importações atualizadas para usar os novos tipos de modelo (ContratoDocument, ContratoModel, IContrato).
 * 2. Tipos de retorno ajustados para diferenciar Documentos Mongoose de objetos Lean.
 *
 * Motivo das Mudanças:
 * As funções que usam `.lean()` (findOne, findPaginatedByQuery) foram tipadas
 * para retornar a interface base `IContrato` (POJO) em vez de `ContratoDocument`.
 * Funções que retornam documentos completos (create, findById) usam `ContratoDocument`
 * para resolver os erros de `FlattenMaps`.
 */

import {
  ContratoModel,
  ContratoDocument, // Importa o tipo HydratedDocument
  IContrato, // Importa a interface base (POJO)
  StatusContrato,
} from '@/db/models/contrato.model';
import { FilterQuery, Types, UpdateQuery } from 'mongoose';

// Tipagem para os filtros de paginação (baseado em contratoService.getAll)
interface IContratoQueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
  status?: StatusContrato;
  clienteId?: string;
}

/**
 * Repositório para abstrair as operações de banco de dados do modelo Contrato.
 */
export class ContratoRepository {
  constructor(private readonly contratoModel: ContratoModel) {}

  /**
   * Cria um novo Contrato.
   * (Usado pelo contratoService.create)
   * @param contratoData - Dados do novo contrato
   * @returns O documento do contrato criado (com populações).
   */
  async create(
    contratoData: Omit<IContrato, 'createdAt' | 'updatedAt' | 'status'> & {
      status: StatusContrato;
    },
  ): Promise<ContratoDocument> {
    const [createdContrato] = await this.contratoModel.create([contratoData]);
    // Popula o retorno (replicando contratoService.create)
    return createdContrato.populate([
      { path: 'cliente', select: 'nome' },
      { path: 'pi', select: 'valorTotal dataInicio dataFim' },
    ]);
  }

  /**
   * Encontra um contrato pelo ID e empresa, com populações complexas.
   * (Usado pelo contratoService.getById e generatePDF)
   * @param id - ID do contrato
   * @param empresaId - ID da empresa proprietária
   * @returns O documento do contrato (com PI, PI.Cliente, Empresa) ou null.
   */
  async findById(
    id: string | Types.ObjectId,
    empresaId: string | Types.ObjectId,
  ): Promise<ContratoDocument | null> {
    return this.contratoModel
      .findOne({ _id: id, empresa: empresaId })
      .populate('empresa') // Popula Empresa (para PDF)
      .populate({
        path: 'pi', // Popula PI
        populate: {
          path: 'cliente', // Popula Cliente DENTRO da PI (para PDF)
        },
      })
      .exec();
  }

  /**
   * Encontra um contrato por um filtro (ex: pelo piId).
   * @param filter - Filtro Mongoose
   * @returns O documento do contrato (POJO) ou null.
   */
  async findOne(
    filter: FilterQuery<ContratoDocument>,
  ): Promise<IContrato | null> {
    // Correção: .lean() retorna a interface base (IContrato)
    return this.contratoModel.findOne(filter).lean().exec();
  }

  /**
   * Atualiza um contrato pelo ID e empresa.
   * @param id - ID do contrato
   * @param empresaId - ID da empresa proprietária
   * @param updateData - Dados a serem atualizados (ex: { status })
   * @returns O documento do contrato atualizado (com populações) ou null.
   */
  async findByIdAndUpdate(
    id: string | Types.ObjectId,
    empresaId: string | Types.ObjectId,
    updateData: UpdateQuery<IContrato>, // Pode usar IContrato ou ContratoDocument
  ): Promise<ContratoDocument | null> {
    return this.contratoModel
      .findOneAndUpdate({ _id: id, empresa: empresaId }, { $set: updateData }, {
        new: true,
        runValidators: true,
      })
      .populate('cliente', 'nome')
      .populate('pi', 'valorTotal dataInicio dataFim') // Popula o retorno
      .exec();
  }

  /**
   * Deleta um contrato pelo ID e empresa.
   * (Usado pelo contratoService.delete)
   * @param id - ID do contrato
   * @param empresaId - ID da empresa proprietária
   * @returns O resultado da operação de deleção.
   */
  async deleteOne(
    id: string | Types.ObjectId,
    empresaId: string | Types.ObjectId,
  ) {
    return this.contratoModel.deleteOne({ _id: id, empresa: empresaId }).exec();
  }

  /**
   * Busca Contratos com paginação, filtros e ordenação.
   * (Baseado no getAll do contratoService.js)
   *
   * @param empresaId - ID da empresa
   * @param options - Opções de consulta (filtros, paginação, etc.)
   * @returns Objeto com os dados paginados (POJOs) e a contagem total.
   */
  async findPaginatedByQuery(
    empresaId: string | Types.ObjectId,
    options: IContratoQueryOptions,
  ): Promise<{ data: IContrato[]; totalDocs: number; totalPages: number }> {
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
    const camposOrdenaveis = ['createdAt', 'updatedAt', 'status'];
    const campoOrdenacaoFinal = camposOrdenaveis.includes(sortBy)
      ? sortBy
      : 'createdAt';

    const query: FilterQuery<ContratoDocument> = { empresa: empresaId };

    if (status) query.status = status;
    if (clienteId) query.cliente = clienteId;

    // Executa as queries em paralelo
    const [totalDocs, data] = await Promise.all([
      this.contratoModel.countDocuments(query),
      this.contratoModel
        .find(query)
        .populate('cliente', 'nome')
        .populate('pi', 'valorTotal dataInicio dataFim')
        .sort({ [campoOrdenacaoFinal]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean() // Retorna POJOs -> IContrato[]
        .exec(),
    ]);

    return { data, totalDocs, totalPages: Math.ceil(totalDocs / limit) };
  }
}

/**
 * Instância padrão (singleton) do repositório.
 */
export const contratoRepository = new ContratoRepository(ContratoModel);