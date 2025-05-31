declare module 'browser-image-compression' {
  export default function imageCompression(
    file: File,
    options: {
      maxSizeMB?: number;
      maxWidthOrHeight?: number;
      useWebWorker?: boolean;
      maxIteration?: number;
      exifOrientation?: number;
      fileType?: string;
      onProgress?: (progress: number) => void;
      initialQuality?: number;
    }
  ): Promise<File>;
}