export interface PreviewPayload {
    code: string;
    language: string;
    startLine: number;
    theme: string;
}

export interface CaptureResult {
    imageBase64: string;
}
