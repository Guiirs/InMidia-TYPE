/*
 * Arquivo: /db/models/placa.model.ts
 *
 * Resumo das Alterações:
 * 1. Renomeadas as interfaces `IPlacaDocument` e `IPlacaModel` para `PlacaDocument` e `PlacaModel`.
 * 2. Utilizado o tipo `HydratedDocument<IPlaca>` do Mongoose em vez da interface manual `IPlaca & Document`.
 *
 * Motivo das Mudanças:
 * A substituição da interface de Documento manual por `HydratedDocument<IPlaca>`
 * resolve os conflitos de tipo `FlattenMaps`, alinhando a definição do tipo do
 * documento com o tipo de retorno interno que o Mongoose utiliza.
 */

import mongoose, {
  Schema,
  Model,
  Types,
  HydratedDocument, // Importa o tipo de documento hidratado
} from 'mongoose';
import { IEmpresa } from './empresa.model';
import { IRegiao } from './regiao.model';

/**
 * Interface que descreve as propriedades de uma Placa (Mídia).
 * (Baseado em Placa.js e placaService.js)
 */
export interface IPlaca {
  numero_placa: string;
  empresa: Types.ObjectId | IEmpresa;
  regiao: Types.ObjectId | IRegiao;
  coordenadas?: string;
  nomeDaRua?: string;
  tamanho?: string;
  imagem?: string; // Nome do arquivo (key) no R2/S3
  disponivel: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Define o tipo do Documento Mongoose (hidratado).
 */
export type PlacaDocument = HydratedDocument<IPlaca>;

/**
 * Define o tipo do Modelo Mongoose (estático).
 */
export type PlacaModel = Model<PlacaDocument>;

/**
 * Schema do Mongoose para a Placa.
 */
const placaSchema = new Schema<PlacaDocument, PlacaModel, IPlaca>(
  {
    numero_placa: {
      type: String,
      required: [true, 'O número da placa é obrigatório.'],
      trim: true,
    },
    coordenadas: {
      type: String,
      trim: true,
    },
    nomeDaRua: {
      type: String,
      trim: true,
    },
    tamanho: {
      type: String,
      trim: true,
    },
    imagem: {
      type: String,
      trim: true,
    },
    disponivel: {
      type: Boolean,
      default: true,
      index: true,
    },
    regiao: {
      type: Schema.Types.ObjectId,
      ref: 'Regiao',
      required: true, // Corrigido (baseado na lógica do serviço JS)
      index: true,
    },
    empresa: {
      type: Schema.Types.ObjectId,
      ref: 'Empresa',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

/**
 * Índice composto para garantir que o numero_placa seja único
 * dentro da mesma empresa E região.
 * (Replicando a lógica do Placa.js original)
 */
placaSchema.index(
  { empresa: 1, regiao: 1, numero_placa: 1 },
  { unique: true },
);

export const PlacaModel = mongoose.model<PlacaDocument, PlacaModel>(
  'Placa',
  placaSchema,
);