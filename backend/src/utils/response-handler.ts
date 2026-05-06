import { Response } from 'express';

interface ResponseData<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
}


export const responseData = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T
): void => {
  const success = statusCode >= 200 && statusCode < 300;

  const payload: ResponseData<T> = {
    success,
    statusCode,
    message,
  };

  if (data !== undefined) {
    payload.data = data;
  }

  res.status(statusCode).json(payload);
};

export const successResponse = <T>(
  message: string,
  data?: T,
  statusCode: number = 200
) => {
  const payload: ResponseData<T> = {
    success: true,
    statusCode,
    message,
  };

  if (data !== undefined) {
    payload.data = data;
  }

  return payload;
};