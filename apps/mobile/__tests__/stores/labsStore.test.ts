import { act } from '@testing-library/react-native';
import { useLabsStore } from '../../stores/labsStore';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockFetchLabUploads = jest.fn();
const mockFetchLabUploadDetail = jest.fn();
const mockCreateLabUpload = jest.fn();
const mockInterpretLabUpload = jest.fn();
const mockDeleteLabUpload = jest.fn();
const mockFetchBiomarkerHistory = jest.fn();
const mockGetSignedLabFileUrl = jest.fn();

jest.mock('../../services/ai/labs', () => ({
  fetchLabUploads: (...args: unknown[]) => mockFetchLabUploads(...args),
  fetchLabUploadDetail: (...args: unknown[]) => mockFetchLabUploadDetail(...args),
  createLabUpload: (...args: unknown[]) => mockCreateLabUpload(...args),
  interpretLabUpload: (...args: unknown[]) => mockInterpretLabUpload(...args),
  deleteLabUpload: (...args: unknown[]) => mockDeleteLabUpload(...args),
  fetchBiomarkerHistory: (...args: unknown[]) => mockFetchBiomarkerHistory(...args),
  getSignedLabFileUrl: (...args: unknown[]) => mockGetSignedLabFileUrl(...args),
}));

const initialState = {
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

beforeEach(() => {
  jest.clearAllMocks();
  useLabsStore.setState(initialState);
});

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('initial state', () => {
  it('has empty uploads', () => {
    expect(useLabsStore.getState().uploads).toHaveLength(0);
  });

  it('has empty detailsByUploadId', () => {
    expect(useLabsStore.getState().detailsByUploadId).toEqual({});
  });

  it('has empty biomarkerHistoryByName', () => {
    expect(useLabsStore.getState().biomarkerHistoryByName).toEqual({});
  });

  it('is not loading', () => {
    expect(useLabsStore.getState().isLoadingUploads).toBe(false);
    expect(useLabsStore.getState().isLoadingDetail).toBe(false);
    expect(useLabsStore.getState().isUploading).toBe(false);
    expect(useLabsStore.getState().isInterpreting).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// clearError
// ---------------------------------------------------------------------------

describe('clearError', () => {
  it('clears error', () => {
    useLabsStore.setState({ error: 'Oops' });
    useLabsStore.getState().clearError();
    expect(useLabsStore.getState().error).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// fetchUploadList
// ---------------------------------------------------------------------------

describe('fetchUploadList', () => {
  it('fetches and sets uploads', async () => {
    const uploads = [{ id: 'u1', title: 'Blood Panel April' }];
    mockFetchLabUploads.mockResolvedValueOnce(uploads);

    await act(async () => {
      await useLabsStore.getState().fetchUploadList();
    });

    expect(useLabsStore.getState().uploads).toHaveLength(1);
    expect(useLabsStore.getState().isLoadingUploads).toBe(false);
  });

  it('sets error when fetch fails', async () => {
    mockFetchLabUploads.mockRejectedValueOnce(new Error('Fetch failed'));

    await act(async () => {
      await useLabsStore.getState().fetchUploadList();
    });

    expect(useLabsStore.getState().error).toBe('Fetch failed');
    expect(useLabsStore.getState().isLoadingUploads).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// loadUploadDetail
// ---------------------------------------------------------------------------

describe('loadUploadDetail', () => {
  it('loads detail and stores by uploadId', async () => {
    const detail = {
      upload: { id: 'u1', title: 'Blood Panel' },
      biomarkers: [{ name: 'Glucose', value: 90 }],
    };
    mockFetchLabUploadDetail.mockResolvedValueOnce(detail);

    await act(async () => {
      await useLabsStore.getState().loadUploadDetail('u1');
    });

    expect(useLabsStore.getState().detailsByUploadId['u1']).toBeDefined();
    expect(useLabsStore.getState().isLoadingDetail).toBe(false);
  });

  it('adds upload to list if not already present', async () => {
    const detail = {
      upload: { id: 'u1', title: 'Blood Panel' },
      biomarkers: [],
    };
    mockFetchLabUploadDetail.mockResolvedValueOnce(detail);

    await act(async () => {
      await useLabsStore.getState().loadUploadDetail('u1');
    });

    expect(useLabsStore.getState().uploads).toHaveLength(1);
  });

  it('merges existing upload in list', async () => {
    useLabsStore.setState({ uploads: [{ id: 'u1', title: 'Old Title' } as never] });
    const detail = {
      upload: { id: 'u1', title: 'Updated Title' },
      biomarkers: [],
    };
    mockFetchLabUploadDetail.mockResolvedValueOnce(detail);

    await act(async () => {
      await useLabsStore.getState().loadUploadDetail('u1');
    });

    expect(useLabsStore.getState().uploads).toHaveLength(1);
    expect(useLabsStore.getState().uploads[0]?.title).toBe('Updated Title');
  });

  it('sets error when detail fetch fails', async () => {
    mockFetchLabUploadDetail.mockRejectedValueOnce(new Error('Not found'));

    await act(async () => {
      await useLabsStore.getState().loadUploadDetail('u1');
    });

    expect(useLabsStore.getState().error).toBe('Not found');
    expect(useLabsStore.getState().isLoadingDetail).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// uploadAndInterpret
// ---------------------------------------------------------------------------

describe('uploadAndInterpret', () => {
  const uploadArgs = {
    userId: 'user-123',
    title: 'Blood Panel',
    fileBase64: 'base64data==',
    mimeType: 'image/jpeg' as const,
    fileType: 'image' as never,
  };

  it('creates upload, interprets, and returns response', async () => {
    const created = { id: 'u-new', title: 'Blood Panel' };
    const interpretResponse = { summary: 'All normal', biomarkers: [] };
    const detail = { upload: created, biomarkers: [] };

    mockCreateLabUpload.mockResolvedValueOnce(created);
    mockInterpretLabUpload.mockResolvedValueOnce(interpretResponse);
    mockFetchLabUploadDetail.mockResolvedValueOnce(detail);

    let result: unknown;
    await act(async () => {
      result = await useLabsStore.getState().uploadAndInterpret(uploadArgs);
    });

    expect(result).toEqual(interpretResponse);
    expect(useLabsStore.getState().uploads).toHaveLength(1);
    expect(useLabsStore.getState().isUploading).toBe(false);
    expect(useLabsStore.getState().isInterpreting).toBe(false);
  });

  it('sets error and rethrows when create fails', async () => {
    mockCreateLabUpload.mockRejectedValueOnce(new Error('Upload failed'));

    await expect(
      useLabsStore.getState().uploadAndInterpret(uploadArgs)
    ).rejects.toThrow('Upload failed');

    expect(useLabsStore.getState().error).toBe('Upload failed');
    expect(useLabsStore.getState().isUploading).toBe(false);
  });

  it('sets isInterpreting false and rethrows when interpret fails', async () => {
    const created = { id: 'u-new', title: 'Blood Panel' };
    mockCreateLabUpload.mockResolvedValueOnce(created);
    mockInterpretLabUpload.mockRejectedValueOnce(new Error('Interpret failed'));
    // fetchUploadList is called with void after interpret failure; mock it to prevent noise
    mockFetchLabUploads.mockResolvedValueOnce([created]);

    await expect(
      useLabsStore.getState().uploadAndInterpret(uploadArgs)
    ).rejects.toThrow('Interpret failed');

    // isInterpreting is reset even on failure
    expect(useLabsStore.getState().isInterpreting).toBe(false);
    // Note: error may be cleared by the async fetchUploadList side-effect
  });
});

// ---------------------------------------------------------------------------
// removeUpload
// ---------------------------------------------------------------------------

describe('removeUpload', () => {
  it('removes upload and clears its detail', async () => {
    useLabsStore.setState({
      uploads: [{ id: 'u1' } as never],
      detailsByUploadId: { u1: { upload: { id: 'u1' } } as never },
    });
    mockDeleteLabUpload.mockResolvedValueOnce(undefined);

    await act(async () => {
      await useLabsStore.getState().removeUpload('u1');
    });

    expect(useLabsStore.getState().uploads).toHaveLength(0);
    expect(useLabsStore.getState().detailsByUploadId['u1']).toBeUndefined();
  });

  it('sets error and rethrows when delete fails', async () => {
    mockDeleteLabUpload.mockRejectedValueOnce(new Error('Delete failed'));

    await expect(
      useLabsStore.getState().removeUpload('u1')
    ).rejects.toThrow('Delete failed');

    expect(useLabsStore.getState().error).toBe('Delete failed');
  });
});

// ---------------------------------------------------------------------------
// loadBiomarkerHistory
// ---------------------------------------------------------------------------

describe('loadBiomarkerHistory', () => {
  it('fetches and stores biomarker history by name', async () => {
    const history = [
      { id: 'b1', name: 'Glucose', value: 90, collected_at: '2026-03-01' },
      { id: 'b2', name: 'Glucose', value: 88, collected_at: '2026-04-01' },
    ];
    mockFetchBiomarkerHistory.mockResolvedValueOnce(history);

    await act(async () => {
      await useLabsStore.getState().loadBiomarkerHistory('Glucose');
    });

    expect(useLabsStore.getState().biomarkerHistoryByName['Glucose']).toHaveLength(2);
  });

  it('sets error when fetch fails', async () => {
    mockFetchBiomarkerHistory.mockRejectedValueOnce(new Error('History failed'));

    await act(async () => {
      await useLabsStore.getState().loadBiomarkerHistory('Glucose');
    });

    expect(useLabsStore.getState().error).toBe('History failed');
  });
});

// ---------------------------------------------------------------------------
// getSignedUrl
// ---------------------------------------------------------------------------

describe('getSignedUrl', () => {
  it('fetches and caches signed URL', async () => {
    mockGetSignedLabFileUrl.mockResolvedValueOnce('https://cdn.example.com/file.jpg');

    let url: string = '';
    await act(async () => {
      url = await useLabsStore.getState().getSignedUrl('path/to/file.jpg');
    });

    expect(url).toBe('https://cdn.example.com/file.jpg');
    expect(useLabsStore.getState().signedUrlByPath['path/to/file.jpg']).toBeDefined();
  });

  it('returns cached URL without refetching when still valid', async () => {
    // Pre-populate cache with a far-future expiry
    useLabsStore.setState({
      signedUrlByPath: {
        'path/to/file.jpg': {
          url: 'https://cached.example.com/file.jpg',
          expiresAt: Date.now() + 300_000,
        },
      },
    });

    let url: string = '';
    await act(async () => {
      url = await useLabsStore.getState().getSignedUrl('path/to/file.jpg');
    });

    expect(url).toBe('https://cached.example.com/file.jpg');
    expect(mockGetSignedLabFileUrl).not.toHaveBeenCalled();
  });

  it('refetches when cached URL is about to expire', async () => {
    // Near expiry (within 10s buffer)
    useLabsStore.setState({
      signedUrlByPath: {
        'path/to/file.jpg': {
          url: 'https://old.example.com/file.jpg',
          expiresAt: Date.now() + 5_000,
        },
      },
    });
    mockGetSignedLabFileUrl.mockResolvedValueOnce('https://fresh.example.com/file.jpg');

    let url: string = '';
    await act(async () => {
      url = await useLabsStore.getState().getSignedUrl('path/to/file.jpg');
    });

    expect(url).toBe('https://fresh.example.com/file.jpg');
    expect(mockGetSignedLabFileUrl).toHaveBeenCalledTimes(1);
  });
});
