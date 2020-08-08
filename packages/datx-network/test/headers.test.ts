import { MockNetworkPipeline } from './mock/MockNetworkPipeline';
import { setUrl, header } from '../src';

describe('headers', () => {
  it('should work with basic headers', async () => {
    const request = new MockNetworkPipeline('foobar').pipe(
      setUrl('/test'),
      header('foo', '1'),
      header('bar', '2'),
    );

    await request.fetch();

    expect(request['lastHeaders']).toEqual({ foo: '1', bar: '2' });
  });
});
