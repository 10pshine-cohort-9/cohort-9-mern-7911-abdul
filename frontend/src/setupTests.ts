import '@testing-library/jest-dom';

jest.mock('quill', () => {
  return jest.fn().mockImplementation((_container, options) => {
    const root = {
      innerHTML: '',
    };
    return {
      root,
      on: jest.fn().mockImplementation((event, _callback) => {
        if (event === 'text-change') {
        }
      }),
      getSelection: jest.fn().mockReturnValue({ index: 0, length: 0 }),
      setSelection: jest.fn(),
      placeholder: options?.placeholder || '',
    };
  });
});
