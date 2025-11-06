/*
 * Arquivo: /db/models/regiao.model.ts
 *
 * Resumo das Alterações:
 * 1. Renomeadas as interfaces `IRegiaoDocument` e `IRegiaoModel` para `RegiaoDocument` e `RegiaoModel`.
 * 2. Utilizado o tipo `HydratedDocument<IRegiao>` do Mongoose em vez da interface manual `IRegiao & Document`.
 *
 * Motivo das Mudanças:
 * O uso de `HydratedDocument<IRegiao>` alinha a definição do tipo do documento
 * com os tipos internos do Mongoose, corrigindo os erros de `FlattenMaps`.
 */

import mongoose, {
  Schema,
  Model,
  Types,
  HydratedDocument, // Importa o tipo de documento hidratado
} from 'mongoose';
import { IEmpresa } from './empresa.model';

/**
 * Interface que descreve as propriedades de uma Regiao.
 * (Baseado em Regiao.js)
 */
export interface IRegiao {
  nome: string;
  empresa: Types.ObjectId | IEmpresa;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Define o tipo do Documento Mongoose (hidratado).
 */
export type RegiaoDocument = HydratedDocument<IRegiao>;

/**
 * Define o tipo do Modelo Mongoose (estático).
 */
export type RegiaoModel = Model<RegiaoDocument>;

/**
 * Schema do Mongoose para a Regiao.
 */
const regiaoSchema = new Schema<RegiaoDocument, RegiaoModel, IRegiao>(
  {
    nome: {
      type: String,
      required: [true, 'O nome da região é obrigatório.'],
      trim: true,
    },
    empresa: {
      type: Schema.Types.ObjectId,
      ref: 'Empresa',
      required: [true, 'A região deve pertencer a uma empresa.'],
      index: true,
    },
  },
  {
    timestamps: true, // Adiciona createdAt e updatedAt
  },
);

/**
 * Índice composto para garantir que o 'nome' da região seja
 * único dentro de uma mesma 'empresa'.
 * (Replicando a lógica do Regiao.js original)
 */
regiaoSchema.index({ empresa: 1, nome: 1 }, { unique: true });

export const RegiaoModel = mongoose.model<RegiaoDocument, RegiaoModel>(
  'Regiao',
  regiaoSchema,
);