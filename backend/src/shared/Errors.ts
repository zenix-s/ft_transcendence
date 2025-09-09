import { ErrorResult } from './abstractions/Result';

export const notFoundError: ErrorResult = {
    code: '401',
    message: 'Resource not found',
};

export const badRequestError: ErrorResult = {
    code: '400',
    message: 'Bad request',
};

export const unauthorizedError: ErrorResult = {
    code: '403',
    message: 'Unauthorized',
};

export const conflictError: ErrorResult = {
    code: '409',
    message: 'Conflict',
};

export const internalServerError: ErrorResult = {
    code: '500',
    message: 'Internal server error',
};
