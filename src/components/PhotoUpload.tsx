'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { compressSkinPhoto } from '@/lib/image';
import type { PhotoType } from '@/lib/types';

interface PhotoUploadProps {
  userId: string;
  photoType?: PhotoType;
  onUploadComplete: (photoUrl: string, photoId: string) => void;
  onError?: (error: string) => void;
  className?: string;
  compact?: boolean;
  label?: string;
}

export default function PhotoUpload({
  userId,
  photoType = 'skin_face_front',
  onUploadComplete,
  onError,
  className = '',
  compact = false,
  label,
}: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
    setUploading(true);
    setProgress(10);

    try {
      // Compress
      setProgress(20);
      const compressed = await compressSkinPhoto(file);
      setProgress(40);

      const supabase = createClient();
      const timestamp = Date.now();
      const path = `${userId}/${timestamp}.jpg`;

      // Upload to Supabase Storage
      setProgress(50);
      const { error: uploadError } = await supabase.storage
        .from('skin-photos')
        .upload(path, compressed, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg',
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      setProgress(75);

      // Get URL - use createSignedUrl for private bucket
      const { data: urlData } = await supabase.storage
        .from('skin-photos')
        .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year

      const photoUrl = urlData?.signedUrl || path;

      // Save to photo_progress table
      setProgress(85);
      const { data: photoData, error: insertError } = await supabase
        .from('photo_progress')
        .insert({
          user_id: userId,
          photo_url: photoUrl,
          photo_type: photoType,
          taken_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (insertError) throw new Error(insertError.message);

      setProgress(95);

      // Update daily check-in
      const today = new Date().toISOString().split('T')[0];
      await supabase.from('daily_checkins').upsert(
        {
          user_id: userId,
          date: today,
          photo_uploaded: true,
        },
        { onConflict: 'user_id,date' }
      );

      setProgress(100);
      onUploadComplete(photoUrl, photoData?.id || '');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload gagal';
      onError?.(msg);
    } finally {
      setUploading(false);
      setProgress(0);
      setPreview(null);
      URL.revokeObjectURL(previewUrl);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (compact) {
    return (
      <>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={`px-4 py-2 bg-accent text-accent-fg text-sm font-medium rounded-xl hover:bg-accent-hover transition-all active:scale-[0.98] disabled:opacity-50 ${className}`}
        >
          {uploading ? `${progress}%` : label || '📸 Upload Foto'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />
      </>
    );
  }

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload area */}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="w-full aspect-[3/4] rounded-2xl border-2 border-dashed border-border hover:border-accent transition-colors bg-surface-secondary flex flex-col items-center justify-center gap-3 disabled:opacity-50"
      >
        {preview ? (
          <div className="relative w-full h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover rounded-2xl"
            />
            {/* Progress overlay */}
            {uploading && (
              <div className="absolute inset-0 bg-black/40 rounded-2xl flex flex-col items-center justify-center">
                <div className="w-3/4 h-2 bg-white/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-white text-sm mt-2 font-medium">{progress}%</p>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-text-primary">{label || 'Upload Foto Kulit'}</p>
            <p className="text-xs text-text-tertiary">Tap untuk ambil foto atau pilih dari galeri</p>
          </>
        )}
      </button>
    </div>
  );
}
