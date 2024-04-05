export namespace AWS {
  /* ----------
   * Used to create a custom event for
   * the lambda responsible for sending
   * cognito emails.
   * ---------- */
  export interface CognitoLambdaTrigger {
    callerContext: { awsSdkVersion: string; clientId: string };
    region: string;
    request: {
      clientMetadata: null;
      code: string;
      type: string;
      userAttributes: {
        'cognito:email_alias': string;
        'cognito:user_status': string;
        email_verified: string;
        email: string;
        sub: string;
      };
    };
    triggerSource: string;
    userName: string;
    userPoolId: string;
    version: string;
  }

  /* ----------
   * Used to create a custom event for
   * the lambda responsible for
   * auto verifying users with same domain.
   * ---------- */
  export interface CognitoPreSignupTrigger {
    callerContext: { awsSdkVersion: string; clientId: string };
    region: string;
    request: {
      clientMetadata: null;
      code: string;
      type: string;
      userAttributes: {
        'custom:brand_id': string | undefined;
        'custom:mrf_id': string | undefined;
        'custom:printer_id': string | undefined;
        'custom:third_party_id': string | undefined;
      };
    };
    response: {
      autoConfirmUser: boolean;
      autoVerifyEmail: boolean;
      autoVerifyPhone: boolean;
    };
    triggerSource: string;
    userName: string;
    userPoolId: string;
    version: string;
  }

  export interface DynamoDBLastKey {
    sort_key: string;
    partition_key: string;

    filter?: string;
    search?: string;
    datatype?: string;
  }

  export interface SQSEvent {
    Records: [
      {
        awsRegion: string;
        eventName: string;
        eventSource: string;
        eventTime: string;
        eventVersion: string;
        /* ----------
         * There's no way to know what the event
         * is, so we'll just have to guess.
         * ---------- */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        s3: any;
      },
    ];
  }

  export interface Decoded {
    'custom:job_title': string;
    'custom:roles': string[];
    'custom:full_name': string;
    'custom:brand_id': string;
    'cognito:groups': string[];
    'custom:mrf_id': string;
    'custom:third_party_id': string;
    'custom:printer_id': string;
    aud: string;
    auth_time: number;
    email_verified: boolean;
    email: string;
    event_id: string;
    exp: number;
    iat: number;
    iss: string;
    jti: string;
    origin_jti: string;
    sub: string;
    token_use: string;
  }
}
