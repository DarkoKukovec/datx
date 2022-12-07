export interface IFetchQueryConfiguration {
  /**
   * fetchQuery will not throw on error
   */
  prefetch: boolean | ((res: unknown) => boolean);
}