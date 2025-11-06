/*
 * Arquivo: /db/repositories/aluguel.repository.ts
 *
 * Resumo das Alterações:
 * 1. Importações atualizadas para usar os novos tipos de modelo (AluguelDocument, AluguelModel).
 * 2. Tipos de retorno ajustados para diferenciar Documentos Mongoose de objetos Lean.
 *
 * Motivo das Mudanças:
 * As funções que usam `.lean()` (como findConflicting) retornam POJOs, não documentos Mongoose.
 * Os tipos de retorno foram corrigidos para `IAluguel | null` (a interface base) em vez de
 * `AluguelDocument | null` (o documento hidratado), o que resolve a
 * incompatibilidade de tipo `FlattenMaps` causada pelo `.lean()`.
 */

import {
  AluguelModel,
  AluguelDocument, // Importa o tipo HydratedDocument
  IAluguel, // Importa a interface base (POJO)
} from '@/db/models/aluguel.model';
import { Types, ClientSession } from 'mongoose';

/**
 * Repositório para abstrair as operações de banco de dados do modelo Aluguel.
 */
export class AluguelRepository {
  constructor(private readonly aluguelModel: AluguelModel) {}

  /**
   * Cria um novo aluguel.
   * (Usado pelo aluguelService.createAluguel)
   * @param aluguelData - Dados do novo aluguel
   * @param session - Sessão Mongoose (para transações)
   * @returns O documento do aluguel criado.
   */
  async create(
    aluguelData: Omit<IAluguel, 'createdAt' | 'updatedAt'>,
    session: ClientSession,
  ): Promise<AluguelDocument> {
    const [createdAluguel] = await this.aluguelModel.create([aluguelData], {
      session,
    });
    return createdAluguel;
  }

  /**
   * Busca um aluguel pelo ID e Empresa (com populate).
   * @param id - ID do aluguel
   * @param empresaId - ID da empresa
   * @param session - (Opcional) Sessão Mongoose
   * @returns O documento do aluguel.
   */
  async findById(
    id: string | Types.ObjectId,
    empresaId: string | Types.ObjectId,
    session?: ClientSession,
  ): Promise<AluguelDocument | null> {
    return this.aluguelModel
      .findOne({ _id: id, empresa: empresaId })
      .session(session || null) // Usa a sessão se fornecida
      .exec();
  }

  /**
   * Deleta um aluguel pelo ID e Empresa.
   * @param id - ID do aluguel
   * @param empresaId - ID da empresa
   * @param session - (Opcional) Sessão Mongoose
   * @returns O resultado da operação.
   */
  async deleteOne(
    id: string | Types.ObjectId,
    empresaId: string | Types.ObjectId,
    session?: ClientSession,
  ) {
    return this.aluguelModel
      .deleteOne({ _id: id, empresa: empresaId })
      .session(session || null)
      .exec();
  }

  /**
   * Busca todos os aluguéis de uma placa específica.
   * (Usado pelo aluguelService.getAlugueisByPlaca)
   * @param placaId - ID da placa
   * @param empresaId - ID da empresa
   * @returns Array de documentos de aluguel (populados).
   */
  async findByPlacaId(
    placaId: string | Types.ObjectId,
    empresaId: string | Types.ObjectId,
  ): Promise<AluguelDocument[]> {
    return this.aluguelModel
      .find({ placa: placaId, empresa: empresaId })
      .populate('cliente', 'nome logo_url') // Popula cliente (replicando JS)
      .sort({ data_inicio: -1 }) // Ordena (replicando JS)
      .exec();
  }

  /**
   * Verifica se existe algum aluguel em conflito de datas para uma placa.
   * (Usado pelo aluguelService.createAluguel)
   * @param placaId - ID da placa
   * @param empresaId - ID da empresa
   * @param inicio - Data de início
   * @param fim - Data de fim
   * @param session - (Opcional) Sessão Mongoose
   * @returns O primeiro aluguel conflitante encontrado (POJO), ou null.
   */
  async findConflicting(
    placaId: string | Types.ObjectId,
    empresaId: string | Types.ObjectId,
    inicio: Date,
    fim: Date,
    session?: ClientSession,
  ): Promise<IAluguel | null> {
    // Lógica de conflito:
    // Um conflito existe se (Início do A < Fim do B) E (Fim do A > Início do B)
    // Correção: .lean() retorna a interface base (IAluguel), não AluguelDocument.
    return this.aluguelModel
      .findOne({
        placa: placaId,
        empresa: empresaId,
        data_inicio: { $lt: fim },
        data_fim: { $gt: inicio },
      })
      .session(session || null)
      .lean()
      .exec();
  }

  /**
   * Verifica se uma placa possui ALGUM aluguel ativo na data de hoje.
   * (Usado pelo aluguelService.deleteAluguel e updateStatusJob.js)
   * @param placaId - ID da placa
   * @param empresaId - ID da empresa
   * @param hoje - Objeto Date (representando o dia de hoje, 00:00:00)
   * @param session - (Opcional) Sessão Mongoose
   * @returns O primeiro aluguel ativo encontrado (POJO), ou null.
   */
  async findActiveByPlaca(
    placaId: string | Types.ObjectId,
    empresaId: string | Types.ObjectId,
    hoje: Date,
    session?: ClientSession,
  ): Promise<IAluguel | null> {
    // Correção: .lean() retorna a interface base (IAluguel), não AluguelDocument.
    return this.aluguelModel
      .findOne({
        placa: placaId,
        empresa: empresaId,
        data_inicio: { $lte: hoje },
        data_fim: { $gte: hoje },
      })
      .session(session || null)
      .lean()
      .exec();
  }

  /**
   * Retorna uma lista de IDs de placas que estão ocupadas em um período.
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
    const results = await this.aluguelModel
      .find({
        empresa: empresaId,
        data_inicio: { $lt: fim },
        data_fim: { $gt: inicio },
      })
      .select('placa')
      .lean()
      .exec();

    // Mapeia para um array de ObjectIds
    // O tipo de 'placa' em IAluguel (após .lean()) pode ser ObjectId | IPlaca
    // Mas como selecionamos apenas 'placa', será um ObjectId.
    return results.map((a) => a.placa as Types.ObjectId);
  }

  /**
   * Verifica se um cliente possui aluguéis ativos ou futuros.
   * (Usado pelo clienteService.deleteCliente)
   * @param clienteId - ID do cliente
   * @param empresaId - ID da empresa
   * @param hoje - Data de hoje (para comparar data_fim)
   * @returns True se houver aluguéis, false caso contrário.
   */
  async checkClienteHasActiveAlugueis(
    clienteId: string | Types.ObjectId,
    empresaId: string | Types.ObjectId,
    hoje: Date,
  ): Promise<boolean> {
    const aluguel = await this.aluguelModel
      .findOne({
        cliente: clienteId,
        empresa: empresaId,
        data_fim: { $gte: hoje }, // Verifica se a data fim é hoje ou no futuro
      })
      .lean()
      .exec();
    return !!aluguel;
  }
}

/**
 * Instância padrão (singleton) do repositório.
 */
export const aluguelRepository = new AluguelRepository(AluguelModel);