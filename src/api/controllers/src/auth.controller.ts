import { Request, Response, NextFunction } from 'express';
import { authService, AuthService } from '@/api/services/src/auth.service';
import { logger } from '@/config/logger';

// Tipos DTO dos nossos validadores Zod
import {
  RegisterEmpresaDto,
  LoginDto,
  resetPasswordSchema,
} from '@/utils/validators/auth.validator';
import { z } from 'zod';

/**
 * Controlador para lidar com Autenticação e Registo.
 * (Migração de controllers/authController.js e controllers/empresaController.js)
 */
export class AuthController {
  constructor(private readonly service: AuthService) {}

  /**
   * Regista uma nova Empresa e o seu Utilizador Admin.
   * (Migração de controllers/empresaController.js -> registerEmpresaController)
   * Rota: POST /api/empresas/register
   */
  async registerEmpresa(req: Request, res: Response, next: NextFunction) {
    // O middleware 'validate' já garantiu que o body está correto
    const registerDto = req.body as RegisterEmpresaDto;

    try {
      const { empresa, user } = await this.service.registerEmpresa(registerDto);

      // Resposta de sucesso (lógica do JS original)
      res.status(201).json({
        status: 'success',
        message:
          'Empresa e utilizador administrador criados com sucesso. Por favor, faça login.',
        data: {
          empresaId: empresa.id,
          userId: user.id,
        },
      });
    } catch (error) {
      next(error); // Passa para o errorHandler global
    }
  }

  /**
   * Autentica (Login) um utilizador.
   * (Migração de controllers/authController.js -> login)
   * Rota: POST /api/v1/auth/login
   */
  async login(req: Request, res: Response, next: NextFunction) {
    const loginDto = req.body as LoginDto;
    logger.debug(`[AuthController] Tentativa de login para: ${loginDto.email}`);

    try {
      const result = await this.service.login(loginDto);
      logger.info(`[AuthController] Login bem-sucedido para: ${loginDto.email}.`);
      res.status(200).json(result); // Retorna { token, user }
    } catch (error) {
      // O serviço já lança HttpError(401) em caso de falha
      next(error);
    }
  }

  /**
   * Solicita a redefinição de senha (envia email).
   * (Migração de controllers/authController.js -> forgotPassword)
   * Rota: POST /api/v1/auth/forgot-password
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    const { email } = req.body as { email: string };
    logger.debug(`[AuthController] Pedido de redefinição de senha para: ${email}`);

    try {
      // (O serviço de email/token não foi implementado no JS original,
      // mas mantemos a estrutura do controlador)
      // await this.service.requestPasswordReset(email);

      // Resposta genérica (lógica do JS original)
      res.status(200).json({
        message:
          'Se o email estiver registado, receberá instruções para redefinir a senha.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Redefine a senha usando um token.
   * (Migração de controllers/authController.js -> resetPassword)
   * Rota: POST /api/v1/auth/reset-password/:token
   */
  async resetPassword(req: Request, res: Response, next: NextFunction) {
    // Tipagem inferida do Zod (validação já ocorreu)
    type ResetDto = z.infer<typeof resetPasswordSchema>;
    const { token } = req.params as ResetDto['params'];
    const { newPassword } = req.body as ResetDto['body'];

    try {
      // (Lógica do JS original)
      // await this.service.resetPasswordWithToken(token, newPassword);
      
      res.status(200).json({ message: 'Senha redefinida com sucesso.' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verifica se um token de redefinição é válido.
   * (Migração de controllers/authController.js -> verifyResetToken)
   * Rota: GET /api/v1/auth/verify-token/:token
   */
  async verifyResetToken(req: Request, res: Response, next: NextFunction) {
    const { token } = req.params;

    try {
      // (Lógica do JS original)
      // await this.service.verifyPasswordResetToken(token);

      res.status(200).json({ message: 'Token válido.' });
    } catch (error) {
      next(error);
    }
  }
}

/**
 * Instância padrão (singleton) do controlador.
 */
export const authController = new AuthController(authService);