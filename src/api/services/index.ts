/**
 * Barrel file para a camada de Lógica de Negócios (Services).
 * Exporta todos os serviços principais.
 */

// Serviços de Autenticação e Gestão de Utilizadores
export * from './src/auth.service';
export * from './src/user.service';
export * from './src/admin.service';

// Serviços de Gestão da Entidade Empresa
export * from './src/empresa.service';

// Serviços Core de Entidades
export * from './src/regiao.service';
export * from './src/placa.service';
export * from './src/cliente.service';
export * from './src/aluguel.service';
export * from './src/pi.service';
export * from './src/contrato.service';

// Serviços de Utilitários e Relatórios
export * from './src/pdf.service';
export * from './src/relatorio.service';
export * from './src/public.service';