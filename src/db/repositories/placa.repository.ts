/*
 * Arquivo: /db/repositories/placa.repository.ts
 *
 * Resumo das Alterações:
 * 1. [FIX] Importado `ClientSession` que estava faltando.
 * 2. [FIX] Removido genérico incorreto de `.populate()` no método `create`.
 * 3. [FIX 2] Corrigido erro de chave duplicada '$ne' em `findLocations` para usar `$nin`.
 * 4. [FIX 3] Corrigidos os tipos de retorno de `findLocations` e `findDisponiveisByQuery`
 * para usar tipos de interseção (`&`) e `Pick`/`Omit` que descrevem
 * exatamente os POJOs retornados por `.lean()`.
 * 5. [FIX 4] Corrigido o tipo `LeanPlacaComRegiaoPop` para usar `Pick<IRegiao, 'nome'> & { _id: Types.ObjectId }`,
 * resolvendo o erro ts(2344) sobre `_id` não pertencer a `keyof IRegiao`.
 *
 * Motivo das Mudanças:
 * Funções com `.lean()` retornam POJOs. Se `.select()` ou `.populate()` forem usados,
 * o POJO resultante não corresponde à interface `IPlaca` nem ao `PlacaDocument`.
 * Os novos tipos de retorno descrevem a forma exata desses POJOs.
 */

import {
  PlacaModel,
  PlacaDocument, // Importa o tipo HydratedDocument
  IPlaca, // Importa a interface base (POJO)
} from '@/db/models/placa.model';
import { IRegiao } from '@/db/models/regiao.model'; // Importado para tipagem de populate
import {
  FilterQuery,
  Types,
  UpdateQuery,
  ClientSession, // FIX: Importação adicionada
} from 'mongoose';

// Tipagem para os filtros de paginação (baseado em placaService.getAllPlacas)
interface IPlacaQueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
  regiao_id?: string;
  disponivel?: boolean;
  search?: string;
}

// Tipo customizado para o retorno de findDisponiveisByQuery (Lean + Populated)
// Descreve um POJO `IPlaca`, mas com o campo 'regiao' substituído por um POJO populado
type LeanPlacaComRegiaoPop = Omit<IPlaca, 'regiao'> & {
  _id: Types.ObjectId;
  // FIX: O tipo de 'regiao' (quando populado e lean) é um POJO
  // que contém o campo selecionado ('nome') e o '_id'.
  regiao?: Pick<IRegiao, 'nome'> & { _id: Types.ObjectId };
};

// Tipo customizado para o retorno de findLocations (Lean + Selected)
// Descreve um POJO com `_id` e os campos selecionados de `IPlaca`
type LeanPlacaLocation = Pick<
  IPlaca,
  'numero_placa' | 'nomeDaRua' | 'coordenadas'
> & {
  _id: Types.ObjectId;
};

/**
 * Repositório para abstrair as operações de banco de dados do modelo Placa.
 */
export class PlacaRepository {
  constructor(private readonly placaModel: PlacaModel) {}

  /**
   * Cria uma nova placa.
   * @param placaData - Dados da nova placa
   * @returns O documento da placa criada.
   */
  async create(
    placaData: Omit<IPlaca, 'createdAt' | 'updatedAt' | 'disponivel'>,
  ): Promise<PlacaDocument> {
    const [createdPlaca] = await this.placaModel.create([placaData]);
    // FIX: Removido o genérico incorreto. O populate retorna Promise<PlacaDocument>
    return createdPlaca.populate('regiao', 'nome');
  }

  /**
   * Encontra uma placa pelo ID e empresa.
   * @param id - ID da placa
   * @param empresaId - ID da empresa proprietária
   * @returns O documento da placa (com região populada) ou null.
   */
  async findById(
    id: string | Types.ObjectId,
    empresaId: string | Types.ObjectId,
  ): Promise<PlacaDocument | null> {
    return this.placaModel
      .findOne({ _id: id, empresa: empresaId })
      .populate('regiao', 'nome') // Popula a região
      .exec();
  }

  /**
   * Atualiza uma placa pelo ID e empresa.
   * @param id - ID da placa
   * @param empresaId - ID da empresa proprietária
   * @param updateData - Dados a serem atualizados
   * @returns O documento da placa atualizada (com região populada) ou null.
   */
  async findByIdAndUpdate(
    id: string | Types.ObjectId,
    empresaId: string | Types.ObjectId,
    updateData: UpdateQuery<IPlaca>,
  ): Promise<PlacaDocument | null> {
    return this.placaModel
      .findOneAndUpdate({ _id: id, empresa: empresaId }, { $set: updateData }, {
        new: true,
        runValidators: true,
      })
      .populate('regiao', 'nome') // Popula a região no retorno
      .exec();
  }

  /**
   * Deleta uma placa pelo ID e empresa.
   * @param id - ID da placa
   * @param empresaId - ID da empresa proprietária
   * @returns O documento da placa que foi deletada (para apagar a imagem) ou null.
   */
  async findByIdAndDelete(
    id: string | Types.ObjectId,
    empresaId: string | Types.ObjectId,
  ): Promise<PlacaDocument | null> {
    return this.placaModel
      .findOneAndDelete({ _id: id, empresa: empresaId })
      .exec();
  }

  /**
   * Salva um documento Placa (usado para toggleDisponibilidade).
   * @param placaDoc - O documento Mongoose hidratado
   */
  async save(placaDoc: PlacaDocument): Promise<PlacaDocument> {
    return placaDoc.save();
  }

  /**
   * Atualiza o status de disponibilidade de uma placa.
   * (Usado pelo AluguelService e Cron Job)
   */
  async updateDisponibilidade(
    id: string | Types.ObjectId,
    empresaId: string | Types.ObjectId,
    disponivel: boolean,
    session?: ClientSession | null,
  ) {
    return this.placaModel
      .updateOne(
        { _id: id, empresa: empresaId },
        { $set: { disponivel: disponivel } },
      )
      .session(session || null)
      .exec();
  }

  /**
   * Busca placas com paginação, filtros e ordenação.
   * (Baseado no getAllPlacas do placaService.js)
   *
   * @param empresaId - ID da empresa
   * @param options - Opções de consulta (filtros, paginação, etc.)
   * @returns Objeto com os dados paginados e a contagem total.
   */
  async findPaginatedByQuery(
    empresaId: string | Types.ObjectId,
    options: IPlacaQueryOptions,
  ): Promise<{
    data: PlacaDocument[]; // Retorna Documentos Mongoose
    totalDocs: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'desc',
      regiao_id,
      disponivel,
      search,
    } = options;

    const skip = (page - 1) * limit;
    const sortOrder = order === 'desc' ? -1 : 1;

    // Constrói a query (replicando lógica do placaService.js)
    const query: FilterQuery<PlacaDocument> = { empresa: empresaId };

    if (regiao_id && regiao_id !== 'todas') {
      query.regiao = regiao_id;
    }
    if (disponivel !== undefined) {
      query.disponivel = disponivel;
    }
    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ numero_placa: searchRegex }, { nomeDaRua: searchRegex }];
    }

    // Executa as queries em paralelo
    const [totalDocs, data] = await Promise.all([
      this.placaModel.countDocuments(query),
      this.placaModel
        .find(query)
        .populate('regiao', 'nome')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .exec(), // Retorna documentos Mongoose (pois serão modificados no serviço)
    ]);

    return { data, totalDocs, totalPages: Math.ceil(totalDocs / limit) };
  }

  /**
   * Busca todas as localizações de placas (para o mapa).
   * (Baseado no getAllPlacaLocations do placaService.js)
   * @param empresaId - ID da empresa
   */
  async findLocations(
    empresaId: string | Types.ObjectId,
  ): Promise<LeanPlacaLocation[]> {
    // FIX: Retorna o tipo POJO customizado
    return (await this.placaModel
      .find(
        {
          empresa: empresaId,
          // FIX: Corrigido o erro de chaves duplicadas
          coordenadas: { $exists: true, $nin: [null, ''] },
        },
        '_id numero_placa nomeDaRua coordenadas', // Seleção de campos
      )
      .lean() // Retorna POJOs
      .exec()) as LeanPlacaLocation[]; // Cast para o tipo POJO customizado
  }

  /**
   * Busca placas disponíveis usando uma query complexa (filtros + IDs ocupados).
   * (Baseado no getPlacasDisponiveis do placaService.js)
   * @param finalQuery - A query Mongoose (construída pelo serviço)
   */
  async findDisponiveisByQuery(
    finalQuery: FilterQuery<PlacaDocument>,
  ): Promise<LeanPlacaComRegiaoPop[]> {
    // FIX: Retorna o tipo POJO customizado (Lean + Populado)
    // O cast `as unknown` é necessário para contornar o type-checking
    // estrito do Mongoose v6/v7 com lean() e populate().
    return (await this.placaModel
      .find(finalQuery)
      .populate('regiao', 'nome')
      .sort({ 'regiao.nome': 1, numero_placa: 1 }) // Ordenação padrão da busca
      .lean()
      .exec()) as unknown as LeanPlacaComRegiaoPop[];
  }

  /**
   * Verifica se uma região está em uso por alguma placa.
   * (Usado pelo regiaoService.delete)
   * @param regiaoId - ID da região
   * @param empresaId - ID da empresa
   */
  async checkRegiaoInUse(
    regiaoId: string | Types.ObjectId,
    empresaId: string | Types.ObjectId,
  ): Promise<boolean> {
    // Um .findOne().select('_id').lean() retorna um POJO mínimo ou null
    const placa = await this.placaModel
      .findOne({ regiao: regiaoId, empresa: empresaId })
      .select('_id') // Só precisamos saber se existe
      .lean()
      .exec();
    return !!placa;
  }
}

/**
 * Instância padrão (singleton) do repositório.
 */
export const placaRepository = new PlacaRepository(PlacaModel);