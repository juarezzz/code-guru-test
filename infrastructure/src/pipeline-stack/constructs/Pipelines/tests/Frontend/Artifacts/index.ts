/* ---------- External ---------- */
import { Artifact } from 'aws-cdk-lib/aws-codepipeline';
import { Construct } from 'constructs';

interface Props {
  environment: string;
}

type WebArtifacts = {
  input: Artifact;
  output: Artifact;
};

export class ArtifactsConstruct extends Construct {
  public readonly source: Artifact;

  public readonly brand: WebArtifacts;

  public readonly admin: WebArtifacts;

  public readonly printer: WebArtifacts;

  public readonly rc: WebArtifacts;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.source = new Artifact();

    this.brand = {
      input: new Artifact(`Brand_Artifact_${props.environment}`),
      output: new Artifact(`Brand_Output_Artifact_${props.environment}`),
    };

    this.admin = {
      input: new Artifact(`Admin_Artifact_${props.environment}`),
      output: new Artifact(`Admin_Output_Artifact_${props.environment}`),
    };

    this.printer = {
      input: new Artifact(`Printer_Artifact_${props.environment}`),
      output: new Artifact(`Printer_Output_Artifact_${props.environment}`),
    };

    this.rc = {
      input: new Artifact(`RC_Artifact_${props.environment}`),
      output: new Artifact(`RC_Output_Artifact_${props.environment}`),
    };
  }
}
