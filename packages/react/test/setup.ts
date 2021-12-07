import '@testing-library/jest-dom';
import { mobx } from '@datx/utils';
import { server } from './mocks/server';

import mobxInstance from './mobx';

if (parseInt(process.env.MOBX_VERSION || '0', 10) < 0) {
  mobx.useMobx(false);
}

if ('configure' in mobxInstance) {
  // @ts-ignores
  mobxInstance.configure({
    enforceActions: 'observed',
  });
}

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
