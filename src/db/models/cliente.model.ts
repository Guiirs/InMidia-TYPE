/*
 * Arquivo: /db/models/cliente.model.ts
 *
 * Resumo das Alterações:
 * 1. Renomeadas as interfaces `IClienteDocument` e `IClienteModel` para `ClienteDocument` e `ClienteModel`.
 * 2. Utilizado o tipo `HydratedDocument<ICliente>` do Mongoose em vez da interface manual `ICliente & Document`.
 *
 * Motivo das Mudanças:
 * Substituir a interface de Documento manual por `HydratedDocument<ICliente>` resolve
 * os conflitos de tipo `FlattenMaps` ao alinhar nossa definição de tipo com o tipo de
 * retorno interno do Mongoose, garantindo compatibilidade total.
 */

import mongoose, {
  Schema,
  Model,
  Types,
  HydratedDocument, // Importa o tipo de documento hidratado
} from 'mongoose';
import { IEmpresa } from './empresa.model';

/**
 * Interface que descreve as propriedades de um Cliente.
 * (Baseado em Cliente.js, clienteService.js e swaggerConfig.js)
 */
export interface ICliente {
  nome: string;
  email: string;
  empresa: Types.ObjectId | IEmpresa;
  cnpj?: string | null; // Opcional, mas único (por empresa) se existir
  telefone?: string;
  endereco?: string;
  bairro?: string;
  cidade?: string;
  responsavel?: string;
  segmento?: string;
  logo_url?: string; // Adicionado (baseado na lógica de serviço/upload)
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Define o tipo do Documento Mongoose (hidratado).
 */
export type ClienteDocument = HydratedDocument<ICliente>;

/**
 * Define o tipo do Modelo Mongoose (estático).
 */
export type ClienteModel = Model<ClienteDocument>;

/**
 * Schema do Mongoose para o Cliente.
 */
const clienteSchema = new Schema<ClienteDocument, ClienteModel, ICliente>(
  {
    nome: {
      type: String,
      required: [true, 'O nome do cliente é obrigatório.'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'O email do cliente é obrigatório.'],
      trim: true,
      lowercase: true,
    },
    cnpj: {
      type: String,
      trim: true,
      default: null,
    },
    telefone: {
      type: String,
      trim: true,
    },
    endereco: {
      type: String,
      trim: true,
    },
    bairro: {
      type: String,
      trim: true,
    },
    cidade: {
      type: String,
      trim: true,
    },
    responsavel: {
      type: String,
      trim: true,
    },
    segmento: {
      type: String,
      trim: true,
    },
    logo_url: {
      type: String,
      trim: true,
    },
    empresa: {
      type: Schema.Types.ObjectId,
      ref: 'Empresa',
      required: [true, 'O cliente deve pertencer a uma empresa.'],
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// Garante que CNPJ é único *por empresa* (sparse permite múltiplos nulos)
clienteSchema.index({ empresa: 1, cnpj: 1 }, { unique: true, sparse: true });

// Garante que Email é único *por empresa*
clienteSchema.index({ empresa: 1, email: 1 }, { unique: true });

export const ClienteModel = mongoose.model<ClienteDocument, ClienteModel>(
  'Cliente',
  clienteSchema,
);