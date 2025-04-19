import type { NextApiRequest, NextApiResponse } from 'next';
import openapi from './openapi.json';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(openapi);
}
