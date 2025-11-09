import { CountdownType } from '@shared/constants/GameConstants';
import { CountdownConfig, CountdownInfo } from '../Pong.types';

/**
 * Gestor de countdowns para el juego Pong
 * Maneja los temporizadores de inicio de juego y reanudación después de gol
 */
export class CountdownManager {
    private activeCountdowns = new Map<
        CountdownType,
        {
            remainingTime: number;
            config: CountdownConfig;
            isActive: boolean;
        }
    >();

    /**
     * Inicia un nuevo countdown
     */
    public startCountdown(type: CountdownType, config: CountdownConfig): boolean {
        // Si ya hay un countdown de este tipo activo, cancelarlo
        if (this.activeCountdowns.has(type)) {
            this.cancelCountdown(type);
        }

        this.activeCountdowns.set(type, {
            remainingTime: config.duration,
            config,
            isActive: true,
        });

        return true;
    }

    /**
     * Actualiza todos los countdowns activos
     */
    public update(deltaTime: number): void {
        const toDelete: CountdownType[] = [];

        for (const [type, countdown] of this.activeCountdowns.entries()) {
            if (!countdown.isActive) {
                toDelete.push(type);
                continue;
            }

            countdown.remainingTime -= deltaTime;

            // Si el countdown terminó
            if (countdown.remainingTime <= 0) {
                countdown.remainingTime = 0;
                countdown.isActive = false;

                // Notificar tick final si hay callback
                if (countdown.config.onTick) {
                    countdown.config.onTick(0);
                }

                // Marcar para eliminar después del loop
                toDelete.push(type);

                // Ejecutar callback de completado
                countdown.config.onComplete();
            } else {
                // Solo notificar tick si aún no terminó
                if (countdown.config.onTick) {
                    countdown.config.onTick(Math.ceil(countdown.remainingTime));
                }
            }
        }

        // Eliminar countdowns completados después del loop para evitar problemas de iteración
        for (const type of toDelete) {
            this.activeCountdowns.delete(type);
        }
    }

    /**
     * Cancela un countdown específico
     */
    public cancelCountdown(type: CountdownType): boolean {
        const countdown = this.activeCountdowns.get(type);
        if (countdown && countdown.isActive) {
            countdown.isActive = false;
            this.activeCountdowns.delete(type);
            return true;
        }
        return false;
    }

    /**
     * Cancela todos los countdowns
     */
    public cancelAllCountdowns(): void {
        this.activeCountdowns.clear();
    }

    /**
     * Obtiene información del countdown activo
     */
    public getActiveCountdown(): CountdownInfo {
        for (const [type, countdown] of this.activeCountdowns.entries()) {
            if (countdown.isActive && countdown.remainingTime > 0) {
                return {
                    type,
                    remainingTime: Math.max(0, Math.ceil(countdown.remainingTime)),
                    isActive: true,
                };
            }
        }

        return {
            type: null,
            remainingTime: 0,
            isActive: false,
        };
    }

    /**
     * Verifica si hay algún countdown activo
     */
    public hasActiveCountdown(): boolean {
        return Array.from(this.activeCountdowns.values()).some((c) => c.isActive);
    }

    /**
     * Obtiene el tiempo restante de un countdown específico
     */
    public getRemainingTime(type: CountdownType): number {
        const countdown = this.activeCountdowns.get(type);
        return countdown && countdown.isActive ? Math.ceil(countdown.remainingTime) : 0;
    }

    /**
     * Verifica si un countdown específico está activo
     */
    public isCountdownActive(type: CountdownType): boolean {
        const countdown = this.activeCountdowns.get(type);
        return countdown ? countdown.isActive : false;
    }
}
