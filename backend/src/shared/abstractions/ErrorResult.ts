export default class ErrorResult {
    public code: string;
    public message: string;

    constructor(code: string, message: string) {
        this.code = code;
        this.message = message;
    }

    public toString(): string {
        return `Error ${this.code}: ${this.message}`;
    }
}
