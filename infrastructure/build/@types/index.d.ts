import { App } from 'aws-cdk-lib';
// import { CertificateStack } from '_certificate-stack';

import { BackendStack } from '_stacks/backend-stack';

export namespace Build {
  export type Environment =
    | 'DEV'
    | 'STG'
    | 'PROD'
    | 'PREPROD'
    | 'TEST'
    | 'MAIN';

  export interface BuildAndDeployStackDTO {
    app: App;
    environment: Environment;
  }

  export interface BuildAndDeployCertificateStackDTO
    extends BuildAndDeployStackDTO {
    children_stack?:
      | 'WEB'
      | 'BACK'
      | 'ANALYTICS'
      | 'ADMINWEB'
      | 'BACKAPI'
      | 'RCPORTALWEB'
      | 'PRINTERWEB';
  }

  export type BuildAndDeployPolytagStackDTO = BuildAndDeployStackDTO;

  export interface BuildAndDeployWebStackDTO extends BuildAndDeployStackDTO {
    profile?: string;
  }

  export interface BuildAndDeployAnalyticsStackDTO
    extends BuildAndDeployStackDTO {
    // certificate_stack: CertificateStack;

    pipeline?: boolean;
  }

  export interface BuildAndDeployAnalyticsEdgeStackDTO
    extends BuildAndDeployStackDTO {
    // certificate_stack: CertificateStack;

    pipeline?: boolean;
  }

  export interface BuildAndDeployStackWithPolytagStackDependenciesDTO {
    app: App;
    environment: Environment;

    backend_stack: BackendStack;
    // certificate_stack: CertificateStack;
  }
}
