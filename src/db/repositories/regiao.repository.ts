/*
 * Arquivo: /db/repositories/regiao.repository.ts
 *
 * Resumo das Alterações:
 * 1. Importações atualizadas para usar os novos tipos de modelo (RegiaoDocument, RegiaoModel, IRegiao).
 * 2. Tipos de retorno ajustados para diferenciar Documentos Mongoose (Hydrated) de objetos Lean (POJO).
 *
 * Motivo das Mudanças:
 * Funções com `.lean()` (findByName, findAllByEmpresa) agora retornam a interface
 * base `IRegiao` (POJO). Funções que retornam documentos hidratados (como `findById`)
 * agora usam o tipo `RegiaoDocument` para resolver os erros de `FlattenMaps`.
 */

import {
  RegiaoModel,
  RegiaoDocument, // Importa o tipo HydratedDocument
  IRegiao, // Importa a interface base (POJO)
} from '@/db/models/regiao.model';
import {  Types, UpdateQuery } from 'mongoose';

/**
 * Repositório para abstrair as operações de banco de dados do modelo Regiao.
 */
export class RegiaoRepository {
  constructor(private readonly regiaoModel: RegiaoModel) {}

  /**
   * Cria uma nova região.
   * (Usado pelo regiaoService.create)
   * @param regiaoData - Dados da nova região
   * @returns O documento da região criada.
   */
  async create(
    regiaoData: Omit<IRegiao, 'createdAt' | 'updatedAt'>,
  ): Promise<RegiaoDocument> {
    const [createdRegiao] = await this.regiaoModel.create([regiaoData]);
    return createdRegiao;
  }

  /**
   * Encontra uma região pelo ID e empresa.
   * @param id - ID da região
   * @param empresaId - ID da empresa proprietária
   * @returns O documento da região ou null.
   */
  async findById(
    id: string | Types.ObjectId,
    empresaId: string | Types.ObjectId,
  ): Promise<RegiaoDocument | null> {
    return this.regiaoModel.findOne({ _id: id, empresa: empresaId }).exec();
  }

  /**
   * Encontra uma região pelo nome e empresa (para verificação de duplicatas).
   * (Usado pelo regiaoService.create/update)
   * @param nome - Nome da região
   * @param empresaId - ID da empresa proprietária
   * @returns O documento da região (POJO) ou null.
   */
  async findByName(
    nome: string,
    empresaId: string | Types.ObjectId,
  ): Promise<IRegiao | null> {
    // Procura pelo nome exato (case-sensitive)
    // Correção: .lean() retorna a interface base (IRegiao)
    return this.regiaoModel.findOne({ nome, empresa: empresaId }).lean().exec();
  }

  /**
   * Busca todas as regiões de uma empresa, ordenadas por nome.
   * (Usado pelo regiaoService.getAll)
   * @param empresaId - ID da empresa
   * @returns Array de documentos da região (POJOs).
   */
  async findAllByEmpresa(
    empresaId: string | Types.ObjectId,
  ): Promise<IRegiao[]> {
    // Correção: .lean() retorna a interface base (IRegiao)
    return this.regiaoModel
      .find({ empresa: empresaId })
      .sort({ nome: 1 }) // Replicando a ordenação do regiaoService.js
      .lean() // Retorna POJOs
      .exec();
  }

  /**
   * Atualiza uma região pelo ID e empresa.
   * (Usado pelo regiaoService.update)
   * @param id - ID da região
   * @param empresaId - ID da empresa proprietária
   * @param updateData - Dados a serem atualizados (ex: { nome })
   * @returns O documento da região atualizada ou null.
   */
  async findByIdAndUpdate(
    id: string | Types.ObjectId,
    empresaId: string | Types.ObjectId,
    updateData: UpdateQuery<IRegiao>,
  ): Promise<RegiaoDocument | null> {
    return this.regiaoModel
      .findOneAndUpdate({ _id: id, empresa: empresaId }, { $set: updateData }, {
        new: true,
        runValidators: true,
      })
      .exec();
  }

  /**
   * Deleta uma região pelo ID e empresa.
   * (Usado pelo regiaoService.delete)
   * @param id - ID da região
   * @param empresaId - ID da empresa proprietária
   * @returns O resultado da operação de deleção.
   */
  async deleteOne(
    id: string | Types.ObjectId,
    empresaId: string | Types.ObjectId,
  ) {
    return this.regiaoModel.deleteOne({ _id: id, empresa: empresaId }).exec();
  }
}

/**
 * Instância padrão (singleton) do repositório.
 */
export const regiaoRepository = new RegiaoRepository(RegiaoModel);