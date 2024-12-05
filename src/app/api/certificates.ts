import { NextApiRequest, NextApiResponse } from 'next';
import { generateX509Certificate } from '../utils';

const VALID_API_KEY = 'test_api_key_123';

type CertificateRequest = {
  apiKey: string;
  personalInfo: {
    name: string;
    dni: string;
  };
  biometricProof: {
    provider: string;
    verificationId: string;
  };
  publicKey: string;
};

type CertificateResponse = {
  nft: {
    tokenId: string;
    contractAddress: string;
    transactionHash: string;
  };
  certificate: {
    serialNumber: string;
    subject: string;
    issuer: string;
    validFrom: string;
    validTo: string;
    pemData: string;
  };
};

type ErrorResponse = {
  error: string;
  message: string;
  details?: string[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CertificateResponse | ErrorResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'METHOD_NOT_ALLOWED',
      message: 'Only POST method is allowed'
    });
  }

  try {
    const body = req.body as CertificateRequest;

    // Validate API key
    if (body.apiKey !== VALID_API_KEY) {
      return res.status(401).json({
        error: 'INVALID_API_KEY',
        message: 'The provided API key is invalid'
      });
    }

    // Validate required fields
    if (!validateRequest(body)) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid request parameters',
        details: ['All fields are required']
      });
    }

    // Generate mock certificate data
    const certificate = generateX509Certificate({
      subject: {
        commonName: body.personalInfo.name,
        documentNumber: body.personalInfo.dni,
        organizationName: 'Mock Organization'
      },
      publicKey: body.publicKey,
      validityPeriod: 365 // 1 year validity
    });

    // Create mock response
    const validFrom = new Date();
    const validTo = new Date();
    validTo.setFullYear(validTo.getFullYear() + 1);

    const response: CertificateResponse = {
      nft: {
        tokenId: generateMockTokenId(),
        contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
        transactionHash: generateMockTransactionHash()
      },
      certificate: {
        serialNumber: generateMockSerialNumber(),
        subject: body.personalInfo.name,
        issuer: 'Digital Certificate Authority',
        validFrom: validFrom.toISOString(),
        validTo: validTo.toISOString(),
        pemData: certificate.toString()
      }
    };

    return res.status(200).json(response);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error processing certificate request:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      details: [error.message]
    });
  }
}

function validateRequest(body: CertificateRequest): boolean {
  return Boolean(
    body.personalInfo?.name &&
    body.personalInfo?.dni &&
    body.biometricProof?.provider &&
    body.biometricProof?.verificationId &&
    body.publicKey?.startsWith('0x')
  );
}

function generateMockTokenId(): string {
  return Math.floor(Math.random() * 10000).toString();
}

function generateMockTransactionHash(): string {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

function generateMockSerialNumber(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let serial = '';
  for (let i = 0; i < 6; i++) {
    serial += chars[Math.floor(Math.random() * chars.length)];
  }
  return serial;
}