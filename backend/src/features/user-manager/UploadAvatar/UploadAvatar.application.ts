import { FastifyInstance } from 'fastify';
import { pipeline } from 'stream';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { ICommand } from '@shared/application/abstractions/ICommand.interface';
import { Result } from '@shared/abstractions/Result';
import { ApplicationError } from '@shared/Errors';
import { IUserRepository } from '@shared/infrastructure/repositories/UserRepository';

const pump = promisify(pipeline);

export interface IUploadAvatarRequest {
    userId: number;
    file: {
        file: NodeJS.ReadableStream;
        filename?: string;
        mimetype: string;
    };
}

export interface IUploadAvatarResponse {
    avatarUrl: string;
    message: string;
}

export default class UploadAvatarCommand implements ICommand<IUploadAvatarRequest, IUploadAvatarResponse> {
    private readonly uploadsDir = path.join(process.cwd(), 'uploads', 'avatars');
    private readonly maxFileSize = 5 * 1024 * 1024; // 5MB
    private readonly allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg'];

    private readonly UserRepository: IUserRepository;

    constructor(private readonly fastify: FastifyInstance) {
        if (!fs.existsSync(this.uploadsDir)) {
            fs.mkdirSync(this.uploadsDir, { recursive: true });
        }

        this.UserRepository = this.fastify.UserRepository;
    }

    validate(request?: IUploadAvatarRequest): Result<void> {
        if (!request) {
            return Result.error(ApplicationError.BadRequest);
        }

        if (!request.userId || typeof request.userId !== 'number') {
            return Result.error(ApplicationError.InvalidRequest);
        }

        if (!request.file) {
            return Result.error(ApplicationError.InvalidRequest);
        }

        if (!this.allowedMimeTypes.includes(request.file.mimetype)) {
            return Result.error(ApplicationError.InvalidRequest);
        }

        return Result.success(undefined);
    }

    async execute(request: IUploadAvatarRequest): Promise<Result<IUploadAvatarResponse>> {
        try {
            // 1. Validamos la existencia del usuario
            const userResult = await this.UserRepository.getUser({ id: request.userId });
            if (!userResult.isSuccess) {
                return Result.error(ApplicationError.UserNotFound);
            }

            const user = userResult.value;
            if (!user) {
                return Result.error(ApplicationError.UserNotFound);
            }

            // 2. Si el usuario ya tiene un avatar, eliminamos el archivo antiguo
            if (user.avatar) {
                await this.deleteOldAvatar(user.avatar);
            }

            /* 3. Montamos el nombre y path del archivo a subir
             *   - user_{userId}_{timestamp}.{ext}
             */
            const fileExtension = this.getFileExtension(request.file.filename || request.file.mimetype);
            const fileName = `user_${request.userId}_${Date.now()}${fileExtension}`;
            const filePath = path.join(this.uploadsDir, fileName);

            // 4. Subimos el archivo, controlando el tamaño máximo
            let totalSize = 0;
            const writeStream = fs.createWriteStream(filePath);
            request.file.file.on('data', (chunk: Buffer) => {
                totalSize += chunk.length;
                if (totalSize > this.maxFileSize) {
                    this.fastify.log.error(`File too large: ${totalSize} bytes (max: ${this.maxFileSize})`);
                    writeStream.destroy();
                    try {
                        fs.unlinkSync(filePath);
                    } catch {
                        // Ignore
                    }
                    throw new Error('FileTooLarge');
                }
            });
            await pump(request.file.file, writeStream);

            // 5. Actualizamos la URL del avatar en la base de datos
            const avatarUrl = `/uploads/avatars/${fileName}`;

            const updateResult = await this.UserRepository.updateUserAvatar({
                userId: request.userId,
                avatarUrl,
            });

            if (!updateResult.isSuccess) {
                return Result.error(ApplicationError.AvatarUpdateError);
            }

            try {
                await this.fastify.SocialWebSocketService.notifyFriendsProfileUpdate(request.userId);
            } catch (error) {
                this.fastify.log.error(error, 'Failed to notify friends about avatar update');
            }

            return Result.success({
                avatarUrl,
                message: 'Avatar uploaded successfully',
            });
        } catch (error) {
            if (error instanceof Error) {
                if (error.message === 'FileTooLarge') {
                    return Result.error(ApplicationError.InvalidRequest);
                }
            }

            return Result.error(ApplicationError.AvatarUpdateError);
        }
    }

    private async deleteOldAvatar(avatarUrl: string): Promise<void> {
        try {
            const fileName = avatarUrl.split('/').pop();
            if (fileName) {
                const oldFilePath = path.join(this.uploadsDir, fileName);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                    this.fastify.log.info(`Old avatar deleted: ${oldFilePath}`);
                }
            }
        } catch (error) {
            this.fastify.log.warn(
                'Failed to delete old avatar: ' + (error instanceof Error ? error.message : String(error))
            );
        }
    }

    private getFileExtension(filename: string | undefined): string {
        if (filename && filename.includes('.')) {
            return path.extname(filename);
        }

        return '.png';
    }
}
