module.exports = {
  openAuthSessionAsync: jest.fn().mockResolvedValue({ type: 'success', url: '' }),
  openBrowserAsync: jest.fn().mockResolvedValue({ type: 'dismissed' }),
  dismissBrowser: jest.fn(),
  warmUpAsync: jest.fn().mockResolvedValue(undefined),
  coolDownAsync: jest.fn().mockResolvedValue(undefined),
  maybeCompleteAuthSession: jest.fn().mockReturnValue({ type: 'success' }),
  WebBrowserResultType: { SUCCESS: 'success', CANCEL: 'cancel', DISMISS: 'dismiss', LOCKED: 'locked' },
};
