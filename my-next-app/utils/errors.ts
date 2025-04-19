export class PaymentError extends Error {
  code: string;
  details?: any;
  constructor(message: string, code = 'PAYMENT_ERROR', details?: any) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends Error {
  code: string;
  details?: any;
  constructor(message: string, code = 'VALIDATION_ERROR', details?: any) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

export class AuthError extends Error {
  code: string;
  constructor(message: string, code = 'AUTH_ERROR') {
    super(message);
    this.code = code;
  }
}
