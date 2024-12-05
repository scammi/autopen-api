// src/app/api/certificates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateX509Certificate } from '@/app/utils';

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CertificateRequest;

    if (body.apiKey !== VALID_API_KEY) {
      return NextResponse.json(
        {
          error: 'INVALID_API_KEY',
          message: 'The provided API key is invalid'
        },
        { status: 401 }
      );
    }

    if (!validateRequest(body)) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'Invalid request parameters',
          details: ['All fields are required']
        },
        { status: 400 }
      );
    }

    const certificate = generateX509Certificate({
      subject: {
        commonName: body.personalInfo.name,
        documentNumber: body.personalInfo.dni,
        organizationName: 'Mock Organization'
      },
      publicKey: body.publicKey,
      validityPeriod: 365
    });

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

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Error processing certificate request:', error);
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        details: [error.message]
      },
      { status: 500 }
    );
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