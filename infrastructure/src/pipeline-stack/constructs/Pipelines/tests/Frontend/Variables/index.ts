/* ---------- External ---------- */
import { Construct } from 'constructs';
import { Variable } from 'aws-cdk-lib/aws-codepipeline';

export class VariablesConstruct extends Construct {
  public readonly backend_modified: Variable;

  public readonly frontend_modified: Variable;

  public readonly admin_web_modified: Variable;

  public readonly printer_web_modified: Variable;

  public readonly rc_web_modified: Variable;

  public readonly array: Variable[];

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.backend_modified = new Variable({
      variableName: 'backend_modified',
      defaultValue: 'false',
      description: '(BOOL) Track modifications in the Backend folder.',
    });

    this.frontend_modified = new Variable({
      variableName: 'frontend_modified',
      defaultValue: 'false',
      description: '(BOOL) Track modifications in the Frontend folder.',
    });

    this.admin_web_modified = new Variable({
      variableName: 'admin_web_modified',
      defaultValue: 'false',
      description: '(BOOL) Track modifications in the Admin Web folder.',
    });

    this.printer_web_modified = new Variable({
      variableName: 'printer_web_modified',
      defaultValue: 'false',
      description: '(BOOL) Track modifications in the Printer Web folder.',
    });

    this.rc_web_modified = new Variable({
      variableName: 'rc_web_modified',
      defaultValue: 'false',
      description: '(BOOL) Track modifications in the RC Web folder.',
    });

    this.array = [
      this.backend_modified,
      this.frontend_modified,
      this.admin_web_modified,
      this.printer_web_modified,
      this.rc_web_modified,
    ];
  }
}
