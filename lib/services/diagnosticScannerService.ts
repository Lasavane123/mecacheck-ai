export type DiagnosticScanResult = {
  imageUri: string;
  detectedCodes: string[];
};

export async function prepareDiagnosticScan(
  imageUri: string
): Promise<DiagnosticScanResult> {
  return {
    imageUri,
    detectedCodes: [],
  };
}