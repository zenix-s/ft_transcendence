export type VisualStyle = '2d' | '3d';

export interface IMatchSettings {
    maxScore: number;
    maxGameTime: number;
    visualStyle: VisualStyle;
}

export class MatchSettings {
    private _maxScore: number;
    private _maxGameTime: number;
    private _visualStyle: VisualStyle;

    public static DEFAULT_SETTINGS: IMatchSettings = {
        maxScore: 11,
        maxGameTime: 600,
        visualStyle: '2d',
    };

    private constructor({ maxScore, maxGameTime, visualStyle }: IMatchSettings) {
        this._maxScore = maxScore;
        this._maxGameTime = maxGameTime;
        this._visualStyle = visualStyle;
    }

    public get maxScore(): number {
        return this._maxScore;
    }

    public get maxGameTime(): number {
        return this._maxGameTime;
    }

    public get visualStyle(): VisualStyle {
        return this._visualStyle;
    }

    public static create(settings: IMatchSettings): MatchSettings {
        // Validaciones
        if (settings.maxScore < 1 || settings.maxScore > 100) {
            throw new Error('Max score must be between 1 and 100');
        }

        if (settings.maxGameTime < 30 || settings.maxGameTime > 600) {
            throw new Error('Max game time must be between 30 and 600 seconds');
        }

        if (settings.visualStyle !== '2d' && settings.visualStyle !== '3d') {
            throw new Error('Visual style must be either "2d" or "3d"');
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
                visualStyle: parsed.visualStyle || '2d',
            });
        } catch (error) {
            throw new Error(`Invalid MatchSettings JSON: ${error}`);
        }
    }

    public toJSON(): string {
        return JSON.stringify({
            maxScore: this._maxScore,
            maxGameTime: this._maxGameTime,
            visualStyle: this._visualStyle,
        });
    }

    public toObject(): IMatchSettings {
        return {
            maxScore: this._maxScore,
            maxGameTime: this._maxGameTime,
            visualStyle: this._visualStyle,
        };
    }

    public equals(other: MatchSettings): boolean {
        return (
            this._maxScore === other._maxScore &&
            this._maxGameTime === other._maxGameTime &&
            this._visualStyle === other._visualStyle
        );
    }
}
