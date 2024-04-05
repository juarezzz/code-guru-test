// eslint-disable-next-line no-shadow
enum Environment {
  development = 'DEV',
  staging = 'STG',
  production = 'PROD',
  preprod = 'PREPROD',
  testing = 'TEST',
  main = 'MAIN',
}

type Stack = {
  environment: Environment;
};

export const handleEnvironmentByChoice = (choice?: string): Stack => {
  if (!choice) throw new Error('Stack choice not defined');

  if (choice.startsWith('POLICIES')) {
    return { environment: Environment.production };
  }

  switch (choice) {
    case 'PIPE-MAIN':
      return { environment: Environment.main };

    case 'BACK-DEV':
    case 'WEB-DEV':
    case 'ADMINWEB-DEV':
    case 'RCPORTALWEB-DEV':
    case 'PRINTERWEB-DEV':
    case 'PIPE-DEV':
    case 'DIAGNOSTICS-DEV':
      return { environment: Environment.development };

    case 'WEB-TEST':
    case 'ADMINWEB-TEST':
    case 'RCPORTALWEB-TEST':
    case 'PRINTERWEB-TEST':
    case 'BACK-TEST':
    case 'DIAGNOSTICS-TEST':
      return { environment: Environment.testing };

    case 'WEB-PROD':
    case 'ADMINWEB-PROD':
    case 'RCPORTALWEB-PROD':
    case 'PRINTERWEB-PROD':
    case 'BACK-PROD':
    case 'DIAGNOSTICS-PROD':
      return { environment: Environment.production };

    case 'WEB-PREPROD':
    case 'ADMINWEB-PREPROD':
    case 'RCPORTALWEB-PREPROD':
    case 'PRINTERWEB-PREPROD':
    case 'BACK-PREPROD':
    case 'DIAGNOSTICS-PREPROD':
      return { environment: Environment.preprod };

    case 'WEB-STG':
    case 'ADMINWEB-STG':
    case 'RCPORTALWEB-STG':
    case 'PRINTERWEB-STG':
    case 'BACK-STG':
    case 'DIAGNOSTICS-STG':
      return { environment: Environment.staging };

    default:
      throw new Error(`Stack choice "${choice}" is not allowed`);
  }
};
