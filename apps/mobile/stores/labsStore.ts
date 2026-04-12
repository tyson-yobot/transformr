// =============================================================================
// TRANSFORMR -- Labs Store
// Manages lab uploads, interpretations, and biomarkers client-side.
// =============================================================================

import { create } from 'zustand';
import {
  createLabUpload,
  deleteLabUpload,
  fetchBiomarkerHistory,
  fetchLabUploadDetail,
  fetchLabUploads,
  getSignedLabFileUrl,
  interpretLabUpload,
} from '@services/ai/labs';
import type {
  LabBiomarker,
  LabFileType,
  LabInterpretResponse,
  LabUpload,
  LabUploadDetail,
} from '@app-types/ai';

interface UploadAndInterpretArgs {
  userId: string;
  title: string;
  labName?: string;
  collectedAt?: string;
  fileBase64: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  fileType: LabFileType;
  fileSizeBytes?: number;
  notes?: string;
}

interface LabsState {
  uploads: LabUpload[];
  detailsByUploadId: Record<string, LabUploadDetail>;
  biomarkerHistoryByName: Record<string, LabBiomarker[]>;
  signedUrlByPath: Record<string, { url: string; expiresAt: number }>;
  isLoadingUploads: boolean;
  isLoadingDetail: boolean;
  isUploading: boolean;
  isInterpreting: boolean;
  error: string | null;
}

interface LabsActions {
  fetchUploadList: () => Promise<void>;
  loadUploadDetail: (uploadId: string) => Promise<void>;
  uploadAndInterpret: (
    args: UploadAndInterpretArgs,
  ) => Promise<LabInterpretResponse>;
  removeUpload: (uploadId: string) => Promise<void>;
  loadBiomarkerHistory: (name: string) => Promise<void>;
  getSignedUrl: (storagePath: string) => Promise<string>;
  clearError: () => void;
}

type LabsStore = LabsState & LabsActions;

const initialState: LabsState = {
  uploads: [],
  detailsByUploadId: {},
  biomarkerHistoryByName: {},
  signedUrlByPath: {},
  isLoadingUploads: false,
  isLoadingDetail: false,
  isUploading: false,
  isInterpreting: false,
  error: null,
};

function toErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'Unknown error';
}

export const useLabsStore = create<LabsStore>()((set, get) => ({
  ...initialState,

  fetchUploadList: async () => {
    set({ isLoadingUploads: true, error: null });
    try {
      const uploads = await fetchLabUploads();
      set({ uploads, isLoadingUploads: false });
    } catch (err) {
      set({ isLoadingUploads: false, error: toErrorMessage(err) });
    }
  },

  loadUploadDetail: async (uploadId) => {
    set({ isLoadingDetail: true, error: null });
    try {
      const detail = await fetchLabUploadDetail(uploadId);
      set((state) => ({
        isLoadingDetail: false,
        detailsByUploadId: {
          ...state.detailsByUploadId,
          [uploadId]: detail,
        },
        uploads: state.uploads.some((u) => u.id === uploadId)
          ? state.uploads.map((u) => (u.id === uploadId ? detail.upload : u))
          : [detail.upload, ...state.uploads],
      }));
    } catch (err) {
      set({ isLoadingDetail: false, error: toErrorMessage(err) });
    }
  },

  uploadAndInterpret: async (args) => {
    set({ isUploading: true, error: null });
    let createdUpload: LabUpload;
    try {
      createdUpload = await createLabUpload(args);
      set((state) => ({
        uploads: [createdUpload, ...state.uploads],
        isUploading: false,
        isInterpreting: true,
      }));
    } catch (err) {
      set({ isUploading: false, error: toErrorMessage(err) });
      throw err;
    }

    try {
      const response = await interpretLabUpload({
        uploadId: createdUpload.id,
        imageBase64: args.fileBase64,
        mimeType: args.mimeType,
        collectedAt: args.collectedAt,
        labName: args.labName,
      });

      // Refresh detail so highlights/concerns/biomarkers are visible
      await get().loadUploadDetail(createdUpload.id);

      set({ isInterpreting: false });
      return response;
    } catch (err) {
      set({ isInterpreting: false, error: toErrorMessage(err) });
      // Still refresh the upload list so the failed status is visible
      void get().fetchUploadList();
      throw err;
    }
  },

  removeUpload: async (uploadId) => {
    try {
      await deleteLabUpload(uploadId);
      set((state) => {
        const nextDetails = { ...state.detailsByUploadId };
        delete nextDetails[uploadId];
        return {
          uploads: state.uploads.filter((u) => u.id !== uploadId),
          detailsByUploadId: nextDetails,
        };
      });
    } catch (err) {
      set({ error: toErrorMessage(err) });
      throw err;
    }
  },

  loadBiomarkerHistory: async (name) => {
    try {
      const history = await fetchBiomarkerHistory(name);
      set((state) => ({
        biomarkerHistoryByName: {
          ...state.biomarkerHistoryByName,
          [name]: history,
        },
      }));
    } catch (err) {
      set({ error: toErrorMessage(err) });
    }
  },

  getSignedUrl: async (storagePath) => {
    const cached = get().signedUrlByPath[storagePath];
    if (cached && cached.expiresAt > Date.now() + 10_000) {
      return cached.url;
    }
    const url = await getSignedLabFileUrl(storagePath, 300);
    set((state) => ({
      signedUrlByPath: {
        ...state.signedUrlByPath,
        [storagePath]: { url, expiresAt: Date.now() + 290_000 },
      },
    }));
    return url;
  },

  clearError: () => set({ error: null }),
}));
