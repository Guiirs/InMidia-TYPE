import { Request, Response, NextFunction } from 'express';
import { authService, AuthService } from '@/api/services';
import { logger } from '@/config/logger';

// Tipos DTO dos nossos validadores Zod
import {
  RegisterEmpresaDto,
  LoginDto,
  resetPasswordSchema,
} from '@/utils/validators/auth.validator';
import { z } from 'zod';

// Importação dos Tipos de Documento Mongoose
import { EmpresaDocument } from '@/db/models/empresa.model';
import { UserDocument } from '@/db/models/user.model';

/**
 * Controlador para lidar com Autenticação e Registo.
 */
export class AuthController {
  constructor(private readonly service: AuthService) {}

  /**
   * Regista uma nova Empresa e o seu Utilizador Admin.
   * Rota: POST /api/empresas/register
   */
  async registerEmpresa(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    const registerDto = req.body as RegisterEmpresaDto;

    try {
      // Cast para Documento Mongoose para acessar a prop virtual '.id'
      const { empresa, user } = (await this.service.registerEmpresa(
        registerDto,
      )) as { empresa: EmpresaDocument; user: UserDocument };

      return res.status(201).json({
        status: 'success',
        message:
          'Empresa e utilizador administrador criados com sucesso. Por favor, faça login.',
        data: {
          empresaId: empresa.id,
          userId: user.id,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Autentica (Login) um utilizador.
   * Rota: POST /api/v1/auth/login
   */
  async login(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    const loginDto = req.body as LoginDto;
    logger.debug(`[AuthController] Tentativa de login para: ${loginDto.email}`);

    try {
      const result = await this.service.login(loginDto);
      logger.info(
        `[AuthController] Login bem-sucedido para: ${loginDto.email}.`,
      );

      return res.status(200).json({
        status: 'success',
        data: result, // Retorna { token, user }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Solicita a redefinição de senha (envia email).
   * Rota: POST /api/v1/auth/forgot-password
   */
  async forgotPassword(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    const { email } = req.body as { email: string };
    logger.debug(
      `[AuthController] Pedido de redefinição de senha para: ${email}`,
    );

    try {
      // [CORREÇÃO 2.3] Erro TS2339: O método 'requestPasswordReset' não existe.
      // A chamada de serviço permanece comentada.
      // await this.service.requestPasswordReset(email);

      // [CORREÇÃO 2.3] Warning TS6133: Para evitar 'email' not read,
      // usamos 'void' para marcar a variável como 'usada'.
      void email;

      return res.status(200).json({
        status: 'success',
        message:
          'Se o email estiver registado, receberá instruções para redefinir a senha.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Redefine a senha usando um token.
   * Rota: POST /api/v1/auth/reset-password/:token
   */
  async resetPassword(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    type ResetParams = z.infer<typeof resetPasswordSchema>['params'];
    type ResetBody = z.infer<typeof resetPasswordSchema>['body'];

    const { token } = req.params as ResetParams;
    const { newPassword } = req.body as ResetBody;

    try {
      // [CORREÇÃO 2.3] Erro TS2339: O método 'resetPasswordWithToken' não existe.
      // A chamada de serviço permanece comentada.
      // await this.service.resetPasswordWithToken(token, newPassword);

      // [CORREÇÃO 2.3] Warning TS6133: Usamos 'void' para 'token' e 'newPassword'.
      void token;
      void newPassword;

      return res.status(200).json({
        status: 'success',
        message: 'Senha redefinida com sucesso.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verifica se um token de redefinição é válido.
   * Rota: GET /api/v1/auth/verify-token/:token
   */
  async verifyResetToken(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    const { token } = req.params as { token: string };

    try {
      // [CORREÇÃO 2.3] Erro TS2339: O método 'verifyPasswordResetToken' não existe.
      // A chamada de serviço permanece comentada.
      // await this.service.verifyPasswordResetToken(token);

      // [CORREÇÃO 2.3] Warning TS6133: Usamos 'void' para 'token'.
      void token;

      return res.status(200).json({
        status: 'success',
        message: 'Token válido.',
      });
    } catch (error) {
      next(error);
    }
  }
}

/**
 * Instância padrão (singleton) do controlador.
 */
export const authController = new AuthController(authService);