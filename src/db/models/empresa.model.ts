/*
 * Arquivo: /db/models/empresa.model.ts
 *
 * Resumo das Alterações:
 * 1. Renomeadas as interfaces `IEmpresaDocument` e `IEmpresaModel` para `EmpresaDocument` e `EmpresaModel`.
 * 2. Utilizado o tipo `HydratedDocument<IEmpresa>` do Mongoose em vez da interface manual `IEmpresa & Document`.
 *
 * Motivo das Mudanças:
 * A adoção de `HydratedDocument<IEmpresa>` alinha a definição do nosso documento com os
 * tipos internos do Mongoose, o que é a solução padrão para corrigir os erros de
 * incompatibilidade de tipo `FlattenMaps` (Mongoose v6+).
 */

import mongoose, {
  Schema,
  Model,
  Types,
  HydratedDocument, // Importa o tipo de documento hidratado
} from 'mongoose';
import { IUser } from './user.model'; // Importação futura

/**
 * Interface que descreve as propriedades de uma Empresa.
 * (Baseado em Empresa.js, swaggerConfig.js e services)
 */
export interface IEmpresa {
  nome: string;
  cnpj: string;

  // Campos de endereço (usados por pdfService.js e empresaService.js)
  endereco?: string;
  bairro?: string;
  cidade?: string;
  telefone?: string;

  // Segurança da API (usado por apiKeyAuthMiddleware.js e userService.js)
  api_key_hash?: string;
  api_key_prefix?: string;

  // Status (usado em swaggerConfig.js)
  status_assinatura: 'active' | 'inactive' | 'pending';

  // Referência aos usuários
  usuarios: (Types.ObjectId | IUser)[];

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Define o tipo do Documento Mongoose (hidratado).
 */
export type EmpresaDocument = HydratedDocument<IEmpresa>;

/**
 * Define o tipo do Modelo Mongoose (estático).
 */
export type EmpresaModel = Model<EmpresaDocument>;

/**
 * Schema do Mongoose para a Empresa.
 */
const empresaSchema = new Schema<EmpresaDocument, EmpresaModel, IEmpresa>(
  {
    nome: {
      type: String,
      required: [true, 'O nome da empresa é obrigatório.'],
      trim: true,
    },
    cnpj: {
      type: String,
      required: [true, 'O CNPJ é obrigatório.'],
      unique: true, // CNPJ deve ser único
      trim: true,
      index: true,
    },
    endereco: { type: String, trim: true },
    bairro: { type: String, trim: true },
    cidade: { type: String, trim: true },
    telefone: { type: String, trim: true },

    api_key_hash: {
      type: String,
      select: false, // Nunca retornar o hash por padrão
    },
    api_key_prefix: {
      type: String,
      index: true, // Indexado para buscas rápidas (usado no apiKeyAuth)
      sparse: true, // Permite valores nulos (se a empresa ainda não gerou chave)
    },
    status_assinatura: {
      type: String,
      enum: ['active', 'inactive', 'pending'],
      default: 'pending', // (Assumindo 'pending' ou 'inactive' como padrão)
    },
    usuarios: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  },
);

export const EmpresaModel = mongoose.model<EmpresaDocument, EmpresaModel>(
  'Empresa',
  empresaSchema,
);