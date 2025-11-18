export interface IMatchSettings {
    maxScore: number;
    maxGameTime: number;
}

export class MatchSettings {
    private _maxScore: number;
    private _maxGameTime: number;

    public static DEFAULT_SETTINGS: IMatchSettings = {
        maxScore: 11,
        maxGameTime: 600,
    };

    private constructor({ maxScore, maxGameTime }: IMatchSettings) {
        this._maxScore = maxScore;
        this._maxGameTime = maxGameTime;
    }

    public get maxScore(): number {
        return this._maxScore;
    }

    public get maxGameTime(): number {
        return this._maxGameTime;
    }

    public static create(settings: IMatchSettings): MatchSettings {
        // Validaciones
        if (settings.maxScore < 1 || settings.maxScore > 100) {
            throw new Error('Max score must be between 1 and 100');
        }

        if (settings.maxGameTime < 30 || settings.maxGameTime > 600) {
            throw new Error('Max game time must be between 30 and 600 seconds');
        }

        return new MatchSettings(settings);
    }

    public static default(): MatchSettings {
        return MatchSettings.create(MatchSettings.DEFAULT_SETTINGS);
    }

    public static fromJSON(jsonString: string): MatchSettings {
        try {
            const parsed = JSON.parse(jsonString);
            return MatchSettings.create({
                maxScore: parsed.maxScore,
                maxGameTime: parsed.maxGameTime,
            });
        } catch (error) {
            throw new Error(`Invalid MatchSettings JSON: ${error}`);
        }
    }

    public toJSON(): string {
        return JSON.stringify({
            maxScore: this._maxScore,
            maxGameTime: this._maxGameTime,
        });
    }

    public toObject(): IMatchSettings {
        return {
            maxScore: this._maxScore,
            maxGameTime: this._maxGameTime,
        };
    }

    public equals(other: MatchSettings): boolean {
        return this._maxScore === other._maxScore && this._maxGameTime === other._maxGameTime;
    }
}
