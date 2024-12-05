interface X509CertificateFields {
    version: number;
    serialNumber: string;
    subject: {
      commonName: string;               // Required
      serialNumber?: string;            // CUIT/CUIL/CDI
      organizationName?: string;        // For legal entities
      organizationalUnitName?: string;  // Optional department/division
      countryName: string;             // Required - AR for Argentina
    };
    issuer: {
      commonName: string;
      organizationName: string;
      countryName: string;
    };
    validity: {
      notBefore: string;  // ISO date
      notAfter: string;   // ISO date
    };
    publicKey: {
      algorithm: string;
      value: string;      // Base64 encoded public key
    };
    extensions: {
      keyUsage: string[];
      basicConstraints: {
        isCA: boolean;
        pathLengthConstraint?: number;
      };
      authorityKeyIdentifier?: string;
      subjectKeyIdentifier?: string;
      certificatePolicies?: {
        policyIdentifier: string;
        policyQualifiers?: string[];
      }[];
    };
    signature: {
      algorithm: string;
      value: string;      // Base64 encoded signature
    };
  }
  
  export function generateX509Certificate(params: {
    subject: {
      commonName: string;
      documentNumber: string;
      organizationName?: string;
    },
    publicKey: string,
    validityPeriod: number  // in days
  }): X509CertificateFields {
    const now = new Date();
    const expiry = new Date(now.getTime() + params.validityPeriod * 24 * 60 * 60 * 1000);
  
    return {
      version: 3,
      serialNumber: generateSerialNumber(),
      subject: {
        commonName: params.subject.commonName,
        serialNumber: `CUIT ${params.subject.documentNumber}`,  // Format according to Argentina requirements
        organizationName: params.subject.organizationName,
        countryName: "AR"  // Argentina
      },
      issuer: {
        commonName: "AC MODERNIZACIÓN-PFDR",
        organizationName: "Secretaría de Innovación Pública",
        countryName: "AR"
      },
      validity: {
        notBefore: now.toISOString(),
        notAfter: expiry.toISOString()
      },
      publicKey: {
        algorithm: "RSA-2048",  // Minimum required by regulation
        value: params.publicKey
      },
      extensions: {
        keyUsage: [
          "digitalSignature",
          "nonRepudiation",
          "keyEncipherment"
        ],
        basicConstraints: {
          isCA: false
        },
        certificatePolicies: [{
          policyIdentifier: "2.16.32.1.1.0",  // Example OID for Argentina's policy
          policyQualifiers: [
            "https://pki.jgm.gov.ar/docs/pdf/Politica_Unica_de_Certificacion_v2.0.pdf"
          ]
        }]
      },
      signature: {
        algorithm: "SHA256withRSA",
        value: ""  // To be filled by the CA
      }
    };
  }
  
  function generateSerialNumber(): string {
    // Generate a unique serial number
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
  
  // Example usage:
  // const certificate = generateX509Certificate({
  //   subject: {
  //     commonName: "Juan Pérez",
  //     documentNumber: "20123456789",
  //     organizationName: "Empresa SA"
  //   },
  //   publicKey: "BASE64_ENCODED_PUBLIC_KEY",
  //   validityPeriod: 365  // 1 year
  // });