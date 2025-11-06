/*
 * Arquivo: /db/repositories/cliente.repository.ts
 *
 * Resumo das Alterações:
 * 1. Importações atualizadas para usar os novos tipos de modelo (ClienteDocument, ClienteModel, ICliente).
 * 2. Tipos de retorno ajustados para diferenciar Documentos Mongoose de objetos Lean.
 *
 * Motivo das Mudanças:
 * A função `findByEmpresaPaginated` usa `.lean()` e, portanto, deve retornar
 * a interface base `ICliente[]` (POJOs), e não `ClienteDocument[]`.
 * Funções que retornam documentos hidratados (como `findById`) agora usam
 * o tipo `ClienteDocument` para resolver os erros de `FlattenMaps`.
 */

import {
  ClienteModel,
  ClienteDocument, // Importa o tipo HydratedDocument
  ICliente, // Importa a interface base (POJO)
} from '@/db/models/cliente.model';
import {Types, UpdateQuery } from 'mongoose';

// Opções de paginação
interface IPaginationOptions {
  page?: number;
  limit?: number;
  sort?: Record<string, 1 | -1>;
}

/**
 * Repositório para abstrair as operações de banco de dados do modelo Cliente.
 */
export class ClienteRepository {
  constructor(private readonly clienteModel: ClienteModel) {}

  /**
   * Cria um novo cliente.
   * @param clienteData - Dados do novo cliente
   * @returns O documento do cliente criado.
   */
  async create(
    clienteData: Omit<ICliente, 'createdAt' | 'updatedAt'>,
  ): Promise<ClienteDocument> {
    // 'create' espera um array e retorna um array
    const [createdCliente] = await this.clienteModel.create([clienteData]);
    return createdCliente;
  }

  /**
   * Encontra um cliente pelo ID e empresa.
   * @param id - ID do cliente
   * @param empresaId - ID da empresa proprietária
   * @returns O documento do cliente ou null.
   */
  async findById(
    id: string | Types.ObjectId,
    empresaId: string | Types.ObjectId,
  ): Promise<ClienteDocument | null> {
    return this.clienteModel.findOne({ _id: id, empresa: empresaId }).exec();
  }

  /**
   * Atualiza um cliente pelo ID e empresa.
   * @param id - ID do cliente
   * @param empresaId - ID da empresa proprietária
   * @param updateData - Dados a serem atualizados
   * @returns O documento do cliente atualizado ou null.
   */
  async findByIdAndUpdate(
    id: string | Types.ObjectId,
    empresaId: string | Types.ObjectId,
    updateData: UpdateQuery<ICliente>, // Pode usar ICliente ou ClienteDocument aqui
  ): Promise<ClienteDocument | null> {
    return this.clienteModel
      .findOneAndUpdate({ _id: id, empresa: empresaId }, { $set: updateData }, {
        new: true,
        runValidators: true,
      })
      .exec();
  }

  /**
   * Deleta um cliente pelo ID e empresa.
   * @param id - ID do cliente
   * @param empresaId - ID da empresa proprietária
   * @returns O resultado da operação de deleção.
   */
  async deleteOne(
    id: string | Types.ObjectId,
    empresaId: string | Types.ObjectId,
  ) {
    return this.clienteModel.deleteOne({ _id: id, empresa: empresaId }).exec();
  }

  /**
   * [NOVO - Adicionado pela análise de pi.service.ts]
   * Encontra um cliente pelo ID e empresa (usado para validação).
   * @param id - ID do cliente
   * @param empresaId - ID da empresa proprietária
   * @returns O documento do cliente (POJO) ou null.
   */
  async findByIdAndEmpresa(
    id: string | Types.ObjectId,
    empresaId: string | Types.ObjectId,
  ): Promise<ICliente | null> {
    return this.clienteModel.findOne({ _id: id, empresa: empresaId }).lean().exec();
  }

  /**
   * Deleta um cliente (retornando o documento deletado).
   * (Usado pelo clienteService.deleteCliente para apagar a imagem)
   * @param id - ID do cliente
   * @param empresaId - ID da empresa proprietária
   * @returns O documento do cliente que foi deletado (POJO) ou null.
   */
  async findByIdAndDelete(
    id: string | Types.ObjectId,
    empresaId: string | Types.ObjectId,
  ): Promise<ICliente | null> {
    // Retorna o documento como POJO (lean)
    return this.clienteModel
      .findOneAndDelete({ _id: id, empresa: empresaId })
      .lean()
      .exec();
  }

  /**
   * Encontra clientes de uma empresa com paginação.
   * (Baseado no getAllClientes do clienteService.js)
   * @param empresaId - ID da empresa
   * @param options - Opções de paginação (page, limit, sort)
   * @returns Um objeto com os dados (POJOs) e o total de documentos.
   */
  async findByEmpresaPaginated(
    empresaId: string | Types.ObjectId,
    options: IPaginationOptions = {},
  ): Promise<{ data: ICliente[]; totalDocs: number }> {
    const {
      page = 1,
      limit = 1000, // Padrão alto (replicando clienteService.js)
      sort = { nome: 1 },
    } = options;

    const skip = (page - 1) * limit;

    const query = { empresa: empresaId };

    // Executa as queries de contagem e busca em paralelo
    const [totalDocs, data] = await Promise.all([
      this.clienteModel.countDocuments(query),
      this.clienteModel
        .find(query)
        .select('nome email telefone cnpj responsavel segmento logo_url') // Seleção de campos
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean() // Retorna POJOs (Plain Old JavaScript Objects) -> ICliente[]
        .exec(),
    ]);

    return { data, totalDocs };
  }
}

/**
 * Instância padrão (singleton) do repositório.
 */
export const clienteRepository = new ClienteRepository(ClienteModel);