export class Result<T> {
    public isSuccess: boolean;
    public error?: ErrorResult;
    public value?: T;

    private constructor(isSuccess: boolean, error?: ErrorResult, value?: T) {
        this.isSuccess = isSuccess;
        this.error = error;
        this.value = value;
    }

    public static success<U>(value: U): Result<U> {
        return new Result<U>(true, undefined, value);
    }

    public static failure<U>(code: string, message: string): Result<U> {
        return new Result<U>(false, new ErrorResult(code, message));
    }
}

export class ErrorResult {
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
