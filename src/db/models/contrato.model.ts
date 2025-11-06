/*
 * Arquivo: /db/models/contrato.model.ts
 *
 * Resumo das Alterações:
 * 1. Renomeadas as interfaces `IContratoDocument` e `IContratoModel` para `ContratoDocument` e `ContratoModel`.
 * 2. Utilizado o tipo `HydratedDocument<IContrato>` do Mongoose em vez da interface manual `IContrato & Document`.
 *
 * Motivo das Mudanças:
 * Alinhar a definição do documento com `HydratedDocument<IContrato>` é a solução canônica
 * para os erros de `FlattenMaps`, garantindo que o tipo do nosso documento corresponda
 * exatamente ao que o Mongoose infere em suas operações de query.
 */

import mongoose, {
  Schema,
  Model,
  Types,
  HydratedDocument, // Importa o tipo de documento hidratado
} from 'mongoose';
import { IEmpresa } from './empresa.model';
import { ICliente } from './cliente.model';
import { IPropostaInterna } from './propostaInterna.model';

// Tipos de Enum para clareza e reutilização
export type StatusContrato =
  | 'rascunho'
  | 'ativo'
  | 'concluido'
  | 'cancelado';

/**
 * Interface que descreve as propriedades de um Contrato.
 * (Baseado em Contrato.js)
 */
export interface IContrato {
  empresa: Types.ObjectId | IEmpresa;
  cliente: Types.ObjectId | ICliente;
  pi: Types.ObjectId | IPropostaInterna; // A Proposta Interna que gerou este contrato
  status: StatusContrato;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Define o tipo do Documento Mongoose (hidratado).
 */
export type ContratoDocument = HydratedDocument<IContrato>;

/**
 * Define o tipo do Modelo Mongoose (estático).
 */
export type ContratoModel = Model<ContratoDocument>;

/**
 * Schema do Mongoose para o Contrato.
 * (Replicando a lógica do Contrato.js original)
 */
const contratoSchema = new Schema<ContratoDocument, ContratoModel, IContrato>(
  {
    empresa: {
      type: Schema.Types.ObjectId,
      ref: 'Empresa',
      required: true,
      index: true,
    },
    cliente: {
      type: Schema.Types.ObjectId,
      ref: 'Cliente',
      required: true,
      index: true,
    },
    pi: {
      type: Schema.Types.ObjectId,
      ref: 'PropostaInterna',
      required: true,
      index: true,
      unique: true, // Garante que só existe um contrato por PI
    },
    status: {
      type: String,
      required: true,
      enum: ['rascunho', 'ativo', 'concluido', 'cancelado'],
      default: 'rascunho',
    },
  },
  {
    timestamps: true,
    // Configurações globais de toJSON/toObject já estão em src/db/index.ts
  },
);

export const ContratoModel = mongoose.model<ContratoDocument, ContratoModel>(
  'Contrato',
  contratoSchema,
);