import '@testing-library/jest-dom';
import { server } from './test/msw/server';

// uruchamiamy MSW dla testów
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
