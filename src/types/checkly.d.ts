declare module 'checkly' {
  export function defineConfig(config: any): any;
}

declare module 'checkly/constructs' {
  export class EmailAlertChannel {
    constructor(name: string, config: any);
  }

  export enum Frequency {
    EVERY_24H = 'EVERY_24H',
  }
}
