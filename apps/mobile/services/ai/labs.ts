// =============================================================================
// TRANSFORMR -- Lab Work Scanner + Interpreter Service
// Wraps the ai-lab-interpret Edge Function and provides CRUD + storage helpers
// for lab uploads, interpretations, and biomarkers.
// =============================================================================

import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@services/supabase';
import type {
  LabBiomarker,
  LabFileType,
  LabInterpretation,
  LabInterpretResponse,
  LabUpload,
  LabUploadDetail,
} from '@app-types/ai';

const LAB_BUCKET = 'lab-uploads';

interface CreateLabUploadArgs {
  userId: string;
  title: string;
  labName?: string;
  collectedAt?: string;
  fileBase64: string;
  mimeType: string;
  fileType: LabFileType;
  fileSizeBytes?: number;
  notes?: string;
}

function inferExtension(mimeType: string): string {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  if (mimeType === 'application/pdf') return 'pdf';
  return 'jpg';
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = globalThis.atob(base64);
  const length = binary.length;
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function createLabUpload(
  args: CreateLabUploadArgs,
): Promise<LabUpload> {
  const uploadId = uuidv4();
  const extension = inferExtension(args.mimeType);
  const storagePath = `${args.userId}/${uploadId}.${extension}`;

  const bytes = base64ToUint8Array(args.fileBase64);

  const { error: uploadErr } = await supabase.storage
    .from(LAB_BUCKET)
    .upload(storagePath, bytes, {
      contentType: args.mimeType,
      upsert: false,
    });

  if (uploadErr) throw uploadErr;

  const { data, error } = await supabase
    .from('lab_uploads')
    .insert({
      id: uploadId,
      user_id: args.userId,
      title: args.title,
      lab_name: args.labName ?? null,
      collected_at: args.collectedAt ?? null,
      storage_path: storagePath,
      file_type: args.fileType,
      mime_type: args.mimeType,
      file_size_bytes: args.fileSizeBytes ?? null,
      status: 'pending',
      notes: args.notes ?? null,
    })
    .select('*')
    .single();

  if (error || !data) {
    await supabase.storage.from(LAB_BUCKET).remove([storagePath]);
    throw error ?? new Error('Failed to create lab upload');
  }

  return data as LabUpload;
}

interface InterpretArgs {
  uploadId: string;
  imageBase64: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  collectedAt?: string;
  labName?: string;
}

export async function interpretLabUpload(
  args: InterpretArgs,
): Promise<LabInterpretResponse> {
  const { data, error } = await supabase.functions.invoke('ai-lab-interpret', {
    body: {
      upload_id: args.uploadId,
      image_base64: args.imageBase64,
      mime_type: args.mimeType,
      collected_at: args.collectedAt ?? null,
      lab_name: args.labName ?? null,
    },
  });

  if (error) throw error;
  if (!data) throw new Error('Empty response from Lab Interpreter');
  return data as LabInterpretResponse;
}

export async function fetchLabUploads(): Promise<LabUpload[]> {
  const { data, error } = await supabase
    .from('lab_uploads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  return (data ?? []) as LabUpload[];
}

export async function fetchLabUploadDetail(
  uploadId: string,
): Promise<LabUploadDetail> {
  const [uploadRes, interpretationRes, biomarkersRes] = await Promise.all([
    supabase.from('lab_uploads').select('*').eq('id', uploadId).single(),
    supabase
      .from('lab_interpretations')
      .select('*')
      .eq('upload_id', uploadId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('lab_biomarkers')
      .select('*')
      .eq('upload_id', uploadId)
      .order('category', { ascending: true })
      .order('name', { ascending: true }),
  ]);

  if (uploadRes.error || !uploadRes.data) {
    throw uploadRes.error ?? new Error('Lab upload not found');
  }

  return {
    upload: uploadRes.data as LabUpload,
    interpretation: (interpretationRes.data as LabInterpretation | null) ?? null,
    biomarkers: (biomarkersRes.data ?? []) as LabBiomarker[],
  };
}

export async function deleteLabUpload(uploadId: string): Promise<void> {
  const { data: upload, error: fetchErr } = await supabase
    .from('lab_uploads')
    .select('storage_path')
    .eq('id', uploadId)
    .single();

  if (fetchErr || !upload) {
    throw fetchErr ?? new Error('Lab upload not found');
  }

  await supabase.storage.from(LAB_BUCKET).remove([upload.storage_path]);

  const { error: deleteErr } = await supabase
    .from('lab_uploads')
    .delete()
    .eq('id', uploadId);

  if (deleteErr) throw deleteErr;
}

export async function getSignedLabFileUrl(
  storagePath: string,
  expiresInSeconds = 300,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(LAB_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data) {
    throw error ?? new Error('Failed to create signed URL');
  }
  return data.signedUrl;
}

export async function fetchBiomarkerHistory(
  name: string,
  limit = 24,
): Promise<LabBiomarker[]> {
  const { data, error } = await supabase
    .from('lab_biomarkers')
    .select('*')
    .eq('name', name)
    .order('collected_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as LabBiomarker[];
}
