/*
 * Arquivo: /db/models/propostaInterna.model.ts
 *
 * Resumo das Alterações:
 * 1. Renomeadas as interfaces `IPropostaInternaDocument` e `IPropostaInternaModel` para `PropostaInternaDocument` e `PropostaInternaModel`.
 * 2. Utilizado o tipo `HydratedDocument<IPropostaInterna>` do Mongoose em vez da interface manual `IPropostaInterna & Document`.
 *
 * Motivo das Mudanças:
 * Adoção do `HydratedDocument<IPropostaInterna>` para alinhar a definição do tipo do
 * documento com os tipos internos do Mongoose, corrigindo os erros de `FlattenMaps`.
 */

import mongoose, {
  Schema,
  Model,
  Types,
  HydratedDocument, // Importa o tipo de documento hidratado
} from 'mongoose';
import { IEmpresa } from './empresa.model';
import { ICliente } from './cliente.model';
import { IPlaca } from './placa.model';

// Tipos de Enum para clareza e reutilização
export type TipoPeriodoPI = 'quinzenal' | 'mensal';
export type StatusPI = 'em_andamento' | 'concluida' | 'vencida';

/**
 * Interface que descreve as propriedades de uma Proposta Interna (PI).
 * (Baseado em PropostaInterna.js)
 */
export interface IPropostaInterna {
  empresa: Types.ObjectId | IEmpresa;
  cliente: Types.ObjectId | ICliente;
  tipoPeriodo: TipoPeriodoPI;
  dataInicio: Date;
  dataFim: Date;
  valorTotal: number;
  descricao: string;
  placas: (Types.ObjectId | IPlaca)[]; // Array de referências
  formaPagamento?: string;
  status: StatusPI;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Define o tipo do Documento Mongoose (hidratado).
 */
export type PropostaInternaDocument = HydratedDocument<IPropostaInterna>;

/**
 * Define o tipo do Modelo Mongoose (estático).
 */
export type PropostaInternaModel = Model<PropostaInternaDocument>;

/**
 * Schema do Mongoose para a Proposta Interna.
 * (Replicando a lógica do PropostaInterna.js original)
 */
const propostaInternaSchema = new Schema<
  PropostaInternaDocument,
  PropostaInternaModel,
  IPropostaInterna
>(
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
    tipoPeriodo: {
      type: String,
      required: true,
      enum: ['quinzenal', 'mensal'],
    },
    dataInicio: {
      type: Date,
      required: true,
    },
    dataFim: {
      type: Date,
      required: true,
    },
    valorTotal: {
      type: Number,
      required: true,
    },
    descricao: {
      type: String,
      required: true,
      trim: true,
    },
    placas: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Placa',
      },
    ],
    formaPagamento: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['em_andamento', 'concluida', 'vencida'],
      default: 'em_andamento',
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

export const PropostaInternaModel = mongoose.model<
  PropostaInternaDocument,
  PropostaInternaModel
>('PropostaInterna', propostaInternaSchema);