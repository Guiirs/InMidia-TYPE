/*
 * Arquivo: /db/repositories/empresa.repository.ts
 *
 * Resumo das Alterações:
 * 1. Importações atualizadas para usar os novos tipos de modelo (EmpresaDocument, EmpresaModel, IEmpresa).
 * 2. Tipos de retorno padronizados para `Promise<EmpresaDocument | null>` para refletir
 * o uso de `HydratedDocument` e resolver erros de `FlattenMaps`.
 *
 * Motivo das Mudanças:
 * Ao usar os tipos `EmpresaDocument` (HydratedDocument) e `EmpresaModel` importados
 * do modelo corrigido, alinhamos as expectativas de tipo do repositório com os
 * tipos de retorno reais do Mongoose, eliminando os conflitos `FlattenMaps`.
 */

import { Types, ClientSession, UpdateQuery } from 'mongoose';
import {
  EmpresaModel,
  EmpresaDocument, // Importa o tipo HydratedDocument
  IEmpresa, // Importa a interface base (POJO)
} from '@/db/models/empresa.model';

/**
 * Repositório para abstrair as operações de banco de dados do modelo Empresa.
 */
export class EmpresaRepository {
  constructor(private readonly empresaModel: EmpresaModel) {}

  /**
   * Encontra uma empresa pelo ID.
   * @param id - O ID da empresa
   * @returns O documento da empresa (sem campos sensíveis) ou null.
   */
  async findById(
    id: string | Types.ObjectId,
  ): Promise<EmpresaDocument | null> {
    // Campos sensíveis (como hash) já estão com select: false no model
    return this.empresaModel.findById(id).exec();
  }

  /**
   * Encontra uma empresa pelo ID, selecionando campos específicos.
   * (Usado pelo empresaService para getApiKey/regenerate)
   * @param id - O ID da empresa
   * @param select - String de campos para selecionar (ex: 'apiKey' ou '+api_key_hash')
   * @returns O documento da empresa com campos específicos ou null.
   */
  async findByIdWithSelection(
    id: string | Types.ObjectId,
    select: string,
  ): Promise<EmpresaDocument | null> {
    return this.empresaModel.findById(id).select(select).exec();
  }

  /**
   * Encontra uma empresa pelo prefixo da API Key.
   * (Usado pelo apiKeyAuthMiddleware)
   * @param prefix - O prefixo (ex: "pref_1234")
   * @returns O documento da empresa (incluindo o hash da chave) ou null.
   */
  async findByApiKeyPrefix(
    prefix: string,
  ): Promise<EmpresaDocument | null> {
    return this.empresaModel
      .findOne({ api_key_prefix: prefix })
      .select('+api_key_hash') // Força a inclusão do hash para comparação
      .exec();
  }

  /**
   * Cria uma nova empresa (geralmente dentro de uma transação).
   * (Usado pelo empresaService/register)
   * @param empresaData - Dados da nova empresa (nome, cnpj)
   * @param session - A sessão Mongoose da transação
   */
  async create(
    // Tipo exato esperado para a criação (omitindo campos automáticos)
    empresaData: Pick<IEmpresa, 'nome' | 'cnpj'>,
    session: ClientSession,
  ): Promise<EmpresaDocument> {
    // 'create' espera um array e retorna um array
    const [createdEmpresa] = await this.empresaModel.create([empresaData], {
      session,
    });
    return createdEmpresa;
  }

  /**
   * Salva um documento Empresa (usado para atualizar a lista de usuários
   * ou regenerar a API key dentro de uma transação).
   * @param empresaDoc - O documento Mongoose hidratado
   * @param session - (Opcional) A sessão Mongoose da transação
   */
  async save(
    empresaDoc: EmpresaDocument,
    session?: ClientSession,
  ): Promise<EmpresaDocument> {
    return empresaDoc.save({ session });
  }

  /**
   * Atualiza uma empresa pelo ID.
   * (Usado pelo empresaService para updateEmpresaDetails)
   * @param id - ID da empresa
   * @param updateData - Campos a serem atualizados
   */
  async findByIdAndUpdate(
    id: string | Types.ObjectId,
    updateData: UpdateQuery<IEmpresa>,
  ): Promise<EmpresaDocument | null> {
    return this.empresaModel
      .findByIdAndUpdate(id, { $set: updateData }, {
        new: true, // Retorna o documento modificado
        runValidators: true,
      })
      // Garante que campos sensíveis não retornem na atualização
      .select('-api_key_hash -api_key_prefix')
      .exec();
  }
}

/**
 * Instância padrão (singleton) do repositório.
 */
export const empresaRepository = new EmpresaRepository(EmpresaModel);