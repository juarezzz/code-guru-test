/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Tags } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct, IConstruct } from 'constructs';

const METHODS = ['put', 'get', 'update', 'delete', 'patch', 'post'] as const;

type Resource = {
  [method in (typeof METHODS)[number]]?: { function: IConstruct };
};

export const add_inspector_tags = <T extends Construct>(resource: T) => {
  const endpoint_resource = resource as unknown as Resource;

  for (const method of METHODS) {
    if (endpoint_resource[method]) {
      Tags.of(endpoint_resource[method]!.function).add(
        'InspectorExclusion',
        'LambdaStandardScanning',
      );

      Tags.of(endpoint_resource[method]!.function).add(
        'InspectorCodeExclusion',
        'LambdaCodeScanning',
      );
    }
  }
};

export const add_inspector_tags_to_function = (lambda: NodejsFunction) => {
  Tags.of(lambda).add('InspectorExclusion', 'LambdaStandardScanning');

  Tags.of(lambda).add('InspectorCodeExclusion', 'LambdaCodeScanning');
};
