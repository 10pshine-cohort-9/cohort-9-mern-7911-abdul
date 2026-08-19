import '@testing-library/jest-dom';

jest.mock('quill', () => {
  return jest.fn().mockImplementation((_container: HTMLElement | string, options?: { placeholder?: string }) => {
    const root = {
      innerHTML: '',
    };
    return {
      root,
      on: jest.fn().mockImplementation((event: string, _callback: (...args: any[]) => void) => {
        if (event === 'text-change') {
        }
      }),
      getSelection: jest.fn().mockReturnValue({ index: 0, length: 0 }),
      setSelection: jest.fn(),
      placeholder: options?.placeholder || '',
    };
  });
});
