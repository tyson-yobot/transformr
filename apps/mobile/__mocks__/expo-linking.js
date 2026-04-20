module.exports = {
  createURL: jest.fn().mockReturnValue('exp://localhost/--/'),
  openURL: jest.fn().mockResolvedValue(undefined),
  canOpenURL: jest.fn().mockResolvedValue(true),
  getInitialURL: jest.fn().mockResolvedValue(null),
  addEventListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  useURL: jest.fn().mockReturnValue(null),
};
