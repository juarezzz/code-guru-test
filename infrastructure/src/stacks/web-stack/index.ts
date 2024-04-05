/* ---------- External ---------- */
import { Construct } from 'constructs';
import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';

/* ---------- Stacks ---------- */
import { CertificateWebStack } from '_stacks/certificates/certificate-web-stack';

/* ---------- Constructs ---------- */
import { BucketsConstruct } from '_stacks/web-stack/constructs/Buckets';
import { NextJSConstruct } from '_stacks/web-stack/constructs/NextJS';
import { LambdasConstruct } from '_stacks/web-stack/constructs/Lambdas';
import { CloudfrontConstruct } from '_stacks/web-stack/constructs/Cloudfront';

interface Props extends StackProps {
  profile?: string;
  environment: string;
}

export class WebStack extends Stack {
  public readonly buckets_construct: BucketsConstruct;

  public readonly cloudfront_construct: CloudfrontConstruct;

  public readonly certificate_web_stack: CertificateWebStack;

  public readonly next_js_construct: NextJSConstruct;

  public readonly lambdas_construct: LambdasConstruct;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    this.certificate_web_stack = new CertificateWebStack(
      this,
      `${props.environment}-Certificate-Web`,
      {
        environment: props.environment,
        stack_name: `${props.environment}-Certificate-Web`,
        description: `Certificates for Web stack at ${props.environment} environment`,
        removalPolicy: RemovalPolicy.DESTROY,
      },
    );

    /* ----------
     * Implementation
     * ---------- */
    this.lambdas_construct = new LambdasConstruct(
      this,
      `Lambdas-Construct-${props.environment}-WEB`,
      {
        environment: props.environment,
      },
    );

    this.buckets_construct = new BucketsConstruct(
      this,
      `Buckets-Construct-${props.environment}-WEB`,
      {
        environment: props.environment,
      },
    );

    this.next_js_construct = new NextJSConstruct(
      this,
      `NextJS-Construct-${props.environment}-WEB`,
      {
        profile: props.profile,
        bucket_construct: this.buckets_construct,
        certificate_web_stack: this.certificate_web_stack,
        environment: props.environment,
      },
    );

    this.cloudfront_construct = new CloudfrontConstruct(
      this,
      `Cloudfront-Construct-${props.environment}-WEB`,
      {
        buckets_construct: this.buckets_construct,
        certificate_web_stack: this.certificate_web_stack,
        environment: props.environment,
        lambdas_construct: this.lambdas_construct,
      },
    );
  }
}
