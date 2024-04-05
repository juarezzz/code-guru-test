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

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.source = new Artifact();

    this.brand = {
      input: new Artifact(`CrossBrowser_Brand_Artifact_${props.environment}`),
      output: new Artifact(
        `CrossBrowser_Brand_Output_Artifact_${props.environment}`,
      ),
    };

    this.admin = {
      input: new Artifact(`CrossBrowser_Admin_Artifact_${props.environment}`),
      output: new Artifact(
        `CrossBrowser_Admin_Output_Artifact_${props.environment}`,
      ),
    };

    this.printer = {
      input: new Artifact(`CrossBrowser_Printer_Artifact_${props.environment}`),
      output: new Artifact(
        `CrossBrowser_Printer_Output_Artifact_${props.environment}`,
      ),
    };
  }
}
