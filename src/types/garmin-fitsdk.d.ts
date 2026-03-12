declare module "@garmin/fitsdk" {
  export class Encoder {
    onMesg(mesgNum: number, mesg: Record<string, unknown>): void;
    writeMesg(mesg: Record<string, unknown>): void;
    close(): Uint8Array;
  }

  export class Stream {
    static fromByteArray(bytes: number[]): Stream;
    static fromBuffer(buffer: Buffer): Stream;
  }

  export class Decoder {
    constructor(stream: Stream);
    isFIT(): boolean;
    checkIntegrity(): boolean;
    read(options?: Record<string, unknown>): {
      messages: Record<string, Record<string, unknown>[]>;
      errors: unknown[];
    };
    static isFIT(stream: Stream): boolean;
  }

  export const Profile: {
    MesgNum: Record<string, number>;
  };
}
