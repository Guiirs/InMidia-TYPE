/*
 * Arquivo: /db/models/user.model.ts
 *
 * Resumo das Alterações:
 * 1. Renomeadas as interfaces `IUserDocument` e `IUserModel` para `UserDocument` e `UserModel`.
 * 2. Utilizado o tipo `HydratedDocument<IUser>` do Mongoose em vez da interface manual `IUser & Document`.
 *
 * Motivo das Mudanças:
 * A adoção do `HydratedDocument<IUser>` alinha a definição do tipo do documento
 * com os tipos internos do Mongoose, corrigindo os erros de `FlattenMaps`.
 * A propriedade `password` é opcional na interface `IUser` para refletir o `select: false` do schema.
 */

import mongoose, {
  Schema,
  Model,
  Types,
  HydratedDocument, // Importa o tipo de documento hidratado
} from 'mongoose';
import { IEmpresa } from './empresa.model';

/**
 * Interface que descreve as propriedades que um User tem.
 * (Baseado no User.js)
 */
export interface IUser {
  username: string;
  email: string;
  password?: string; // Opcional ao buscar (select: false)
  nome: string;
  sobrenome: string;
  role: 'user' | 'admin';
  avatar_url?: string;
  resetToken?: string;
  tokenExpiry?: Date;
  empresa: Types.ObjectId | IEmpresa; // Referência à Empresa
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Define o tipo do Documento Mongoose (hidratado).
 */
export type UserDocument = HydratedDocument<IUser>;

/**
 * Define o tipo do Modelo Mongoose (estático).
 */
export type UserModel = Model<UserDocument>;

/**
 * Schema do Mongoose para o User.
 * (Replicando as definições do User.js original)
 */
const userSchema = new Schema<UserDocument, UserModel, IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true, // Garante username único em toda a cole
      index: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true, // Garante email único em toda a cole
      index: true,
      trim: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: {
      type: String,
      required: true,
      select: false, // Não retorna a senha por padrão em queries
    },
    nome: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    sobrenome: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    role: {
      type: String,
      default: 'user',
      enum: ['user', 'admin'],
    },
    avatar_url: {
      type: String,
      trim: true,
    },
    resetToken: String,
    tokenExpiry: Date,
    empresa: {
      type: Schema.Types.ObjectId,
      ref: 'Empresa', // Referência ao modelo 'Empresa'
      required: true,
      index: true,
    },
  },
  {
    timestamps: true, // Adiciona createdAt e updatedAt
  },
);

/**
 * [Otimização]: No seu adminService e empresaService (JS), há lógicas que
 * verificam se username/email já existem DENTRO da mesma empresa.
 * O 'unique: true' acima é GLOBAL.
 * O ideal é um índice único composto por (empresa, email) e (empresa, username).
 *
 * Vamos manter o índice único global por enquanto para replicar o User.js,
 * mas o índice de (empresa, email) era o ideal.
 *
 * Vamos replicar o índice único simples do User.js original.
 */

// Adiciona um índice composto (se necessário, mas o original tinha índices simples)
// userSchema.index({ empresa: 1, email: 1 }, { unique: true });
// userSchema.index({ empresa: 1, username: 1 }, { unique: true });

export const UserModel = mongoose.model<UserDocument, UserModel>(
  'User',
  userSchema,
);