/* ---------- External ---------- */
import {
  Effect,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface Props {
  environment: string;
}

export class PipelineRoles extends Construct {
  public readonly codebuild: Role;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.codebuild = new Role(this, `CodeBuildRole-${props.environment}`, {
      assumedBy: new ServicePrincipal('codebuild.amazonaws.com'),
      description: 'Role for CodeBuild to access AWS resources',
    });

    this.codebuild.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          'secretsmanager:GetSecretValue',
          's3:DeleteObject',
          's3:GetObject',
          's3:ListBucket',
          's3:PutObject',
          'cloudfront:*',
          'ssm:GetParameter',
          'cloudformation:DescribeStacks',
          'cloudformation:GetTemplate',
          'cloudformation:DescribeStackEvents',
          'cloudformation:DescribeStackResources',
          'sts:AssumeRole',
          'ssm:DeleteParameter',
          'ssm:GetParameter',
          'ssm:GetParameters',
          'ssm:GetParametersByPath',
          'ssm:PutParameter',
          'lambda:GetFunctionConfiguration',
          'lambda:UpdateFunctionConfiguration',
          'lambda:InvokeFunction',
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
        ],
        resources: ['*'],
      }),
    );
  }
}
