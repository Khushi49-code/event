// hooks/useFileUpload.ts
"use client";

import { useState, useCallback } from 'react';

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback((file: File, path: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!CLOUD_NAME || !UPLOAD_PRESET) {
        const msg = 'Cloudinary is not configured. Check NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env.local';
        setError(msg);
        reject(new Error(msg));
        return;
      }

      setUploading(true);
      setProgress(0);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);
      formData.append('folder', path.substring(0, path.lastIndexOf('/')) || 'events');

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setProgress((event.loaded / event.total) * 100);
        }
      };

      xhr.onload = () => {
        setUploading(false);
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status === 200 && data.secure_url) {
            setProgress(100);
            resolve(data.secure_url);
          } else {
            const msg = data.error?.message || 'Upload failed';
            setError(msg);
            reject(new Error(msg));
          }
        } catch (parseErr) {
          setError('Unexpected response from Cloudinary');
          reject(new Error('Unexpected response from Cloudinary'));
        }
      };

      xhr.onerror = () => {
        setUploading(false);
        setError('Network error while uploading');
        reject(new Error('Network error while uploading'));
      };

      xhr.send(formData);
    });
  }, []);

  const resetUpload = useCallback(() => {
    setUploading(false);
    setProgress(0);
    setError(null);
  }, []);

  return { uploadFile, uploading, progress, error, resetUpload };
}