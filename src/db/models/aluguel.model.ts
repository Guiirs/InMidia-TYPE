
import mongoose, {
  Schema,
  Model,
  Types,
  HydratedDocument, // Importa o tipo de documento hidratado
} from 'mongoose';
import { IEmpresa } from './empresa.model';
import { ICliente } from './cliente.model';
import { IPlaca } from './placa.model';


export interface IAluguel {
  placa: Types.ObjectId | IPlaca;
  cliente: Types.ObjectId | ICliente;
  empresa: Types.ObjectId | IEmpresa;
  data_inicio: Date;
  data_fim: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type AluguelDocument = HydratedDocument<IAluguel>;

export type AluguelModel = Model<AluguelDocument>;

const aluguelSchema = new Schema<AluguelDocument, AluguelModel, IAluguel>(
  {
    placa: {
      type: Schema.Types.ObjectId,
      ref: 'Placa',
      required: [true, 'A placa é obrigatória.'],
      index: true,
    },
    cliente: {
      type: Schema.Types.ObjectId,
      ref: 'Cliente',
      required: [true, 'O cliente é obrigatório.'],
      index: true,
    },
    empresa: {
      type: Schema.Types.ObjectId,
      ref: 'Empresa',
      required: [true, 'A empresa é obrigatória.'],
      index: true,
    },
    data_inicio: {
      type: Date,
      required: [true, 'A data de início é obrigatória.'],
    },
    data_fim: {
      type: Date,
      required: [true, 'A data de fim é obrigatória.'],
    },
  },
  {
    timestamps: true,
  },
);

aluguelSchema.index({ placa: 1, data_inicio: 1, data_fim: 1 });

aluguelSchema.index({ empresa: 1, data_fim: 1 });

export const AluguelModel = mongoose.model<AluguelDocument, AluguelModel>(
  'Aluguel',
  aluguelSchema,
);