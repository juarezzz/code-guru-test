/* ---------- External ---------- */
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import { Construct } from 'constructs';
import { Duration, RemovalPolicy, Tags } from 'aws-cdk-lib';

/* ---------- Constructs ---------- */
import { DynamoDBConstruct } from '_stacks/backend-stack/constructs/DynamoDB';

/* ---------- Lambdas ---------- */
import { AdminClientsCheckAndSaveLambda } from '_stacks/backend-stack/lambdas/step-functions/admin-clients/check-and-save';
import { GetAllClientsLambda } from '_stacks/backend-stack/lambdas/step-functions/admin-clients/get-all-clients';
import { GetAllLiveCampaignsLambda } from '_stacks/backend-stack/lambdas/step-functions/admin-clients/get-all-live-campaigns';
import { GetAllQRsPrintedDBLambda } from '_stacks/backend-stack/lambdas/step-functions/admin-clients/get-all-qrs-printed-db';
import { GetAllUsersLambda } from '_stacks/backend-stack/lambdas/step-functions/admin-clients/get-all-users';
import { GetQRsPrintedLambda } from '_stacks/backend-stack/lambdas/step-functions/admin-clients/get-qrs-printed';
import { GetTotalReachLambda } from '_stacks/backend-stack/lambdas/step-functions/admin-clients/get-total-reach';
import { add_inspector_tags_to_function } from '_helpers/general/add-inspector-tags';

/* ---------- Interfaces ---------- */
interface Props {
  dynamodb_construct: DynamoDBConstruct;
  environment: string;
}

export class AdminClientsStateMachine extends Construct {
  public readonly definition: sfn.IChainable;

  public readonly state_machine: sfn.StateMachine;

  public readonly first_iterator: sfn.Map;

  public readonly get_all_clients_lambda: GetAllClientsLambda;

  public readonly get_all_users_lambda: GetAllUsersLambda;

  public readonly get_all_live_campaigns_lambda: GetAllLiveCampaignsLambda;

  public readonly get_total_reach_lambda: GetTotalReachLambda;

  public readonly get_total_qrs_printed_lambda: GetQRsPrintedLambda;

  public readonly get_total_qrs_printed_db_lambda: GetAllQRsPrintedDBLambda;

  public readonly admin_clients_check_and_save: AdminClientsCheckAndSaveLambda;

  public readonly choice_all_products_fetch: sfn.Choice;

  public readonly choice_all_clients_fetch: sfn.Choice;

  public readonly choice_all_users_fetch: sfn.Choice;

  public readonly choice_all_live_campaigns_fetch: sfn.Choice;

  public readonly choice_all_total_reach_fetch: sfn.Choice;

  public readonly choice_all_qrs_printed_fetch: sfn.Choice;

  public readonly choice_all_qrs_printed_db_fetch: sfn.Choice;

  public readonly succeed_execution: sfn.Succeed;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    /* ----------
     *  Steps
     * ---------- */
    this.get_all_clients_lambda = new GetAllClientsLambda(
      scope,
      `Get-All-Clients-Step-${props.environment}`,
      {
        dynamodb_construct: props.dynamodb_construct,
        environment: props.environment,
      },
    );

    this.get_all_users_lambda = new GetAllUsersLambda(
      scope,
      `Get-All-Users-Step-${props.environment}`,
      {
        dynamodb_construct: props.dynamodb_construct,
        environment: props.environment,
      },
    );

    this.get_all_live_campaigns_lambda = new GetAllLiveCampaignsLambda(
      scope,
      `Get-All-Live-Campaigns-Step-${props.environment}`,
      {
        dynamodb_construct: props.dynamodb_construct,
        environment: props.environment,
      },
    );

    this.admin_clients_check_and_save = new AdminClientsCheckAndSaveLambda(
      scope,
      `Admin-Clients-Check-And-Save-Step-${props.environment}`,
      {
        dynamodb_construct: props.dynamodb_construct,
        environment: props.environment,
      },
    );

    this.get_total_reach_lambda = new GetTotalReachLambda(
      scope,
      `Get-Total-Reach-Step-${props.environment}`,
      {
        environment: props.environment,
      },
    );

    this.get_total_qrs_printed_lambda = new GetQRsPrintedLambda(
      scope,
      `Get-Total-QRs-Printed-Step-${props.environment}`,
      {
        environment: props.environment,
      },
    );

    this.get_total_qrs_printed_db_lambda = new GetAllQRsPrintedDBLambda(
      scope,
      `Get-Total-QRs-Printed-DB-Step-${props.environment}`,
      {
        environment: props.environment,
      },
    );

    /* ----------
      Iterators
    ---------- */
    this.first_iterator = new sfn.Map(
      scope,
      `Admin-Clients-FirstIterator-STEP-${props.environment}`,
      {
        maxConcurrency: 10,
        inputPath: '$.Payload.clients',
      },
    );

    /* ----------
     * Choices
     * ---------- */
    this.choice_all_products_fetch = new sfn.Choice(
      scope,
      'All products were fetch?',
    );
    this.choice_all_users_fetch = new sfn.Choice(
      scope,
      'All users were fetch?',
    );
    this.choice_all_clients_fetch = new sfn.Choice(
      scope,
      'All clients were fetch?',
    );
    this.choice_all_live_campaigns_fetch = new sfn.Choice(
      scope,
      'All live campaigns were fetch?',
    );
    this.choice_all_total_reach_fetch = new sfn.Choice(
      scope,
      'All total reach were fetch?',
    );
    this.choice_all_qrs_printed_fetch = new sfn.Choice(
      scope,
      'All total qrs printed were fetch?',
    );
    this.choice_all_qrs_printed_db_fetch = new sfn.Choice(
      scope,
      'All total qrs printed (Database) were fetch?',
    );

    this.succeed_execution = new sfn.Succeed(scope, 'Succeed Execution');

    /* ----------
      Definition
    ---------- */
    this.definition = sfn.Chain.start(this.get_all_clients_lambda.case).next(
      this.first_iterator
        .iterator(
          this.get_all_users_lambda.case.next(
            this.choice_all_users_fetch
              .when(
                sfn.Condition.booleanEquals('$.Payload.all_users_fetch', true),
                this.get_all_live_campaigns_lambda.case.next(
                  this.choice_all_live_campaigns_fetch
                    .when(
                      sfn.Condition.booleanEquals(
                        '$.Payload.all_live_campaigns_fetch',
                        true,
                      ),
                      this.get_total_reach_lambda.case.next(
                        this.choice_all_total_reach_fetch
                          .when(
                            sfn.Condition.booleanEquals(
                              '$.Payload.all_total_reach_fetch',
                              true,
                            ),
                            this.get_total_qrs_printed_lambda.case.next(
                              this.choice_all_qrs_printed_fetch
                                .when(
                                  sfn.Condition.booleanEquals(
                                    '$.Payload.all_qrs_printed_fetch',
                                    true,
                                  ),
                                  this.get_total_qrs_printed_db_lambda.case.next(
                                    this.choice_all_qrs_printed_db_fetch
                                      .when(
                                        sfn.Condition.booleanEquals(
                                          '$.Payload.all_qrs_printed_db_fetch',
                                          true,
                                        ),
                                        this.admin_clients_check_and_save.case,
                                      )
                                      .otherwise(
                                        this.get_total_qrs_printed_db_lambda
                                          .case,
                                      ),
                                  ),
                                )
                                .otherwise(
                                  this.get_total_qrs_printed_lambda.case,
                                ),
                            ),
                          )
                          .otherwise(this.get_total_reach_lambda.case),
                      ),
                    )
                    .otherwise(this.get_all_live_campaigns_lambda.case),
                ),
              )
              .otherwise(this.get_all_users_lambda.case),
          ),
        )
        .next(
          this.choice_all_clients_fetch
            .when(
              sfn.Condition.booleanEquals(
                '$[0].Payload.all_clients_fetch',
                true,
              ),
              this.succeed_execution,
            )
            .otherwise(this.get_all_clients_lambda.case),
        ),
    );

    /* ----------
      State Machine
    ---------- */
    this.state_machine = new sfn.StateMachine(
      scope,
      `Admin-Clients-StateMachine-${props.environment}`,
      {
        removalPolicy: RemovalPolicy.DESTROY,
        timeout: Duration.hours(1),
        stateMachineType: sfn.StateMachineType.STANDARD,
        definition: this.definition,
        stateMachineName: `admin-clients-${props.environment}`,
      },
    );

    /* ---------- Tags ---------- */
    Tags.of(this.state_machine).add('Custom:Service', 'State Machine');
    Tags.of(this.state_machine).add('Custom:Environment', props.environment);

    if (props.environment !== 'STG') {
      [
        this.get_all_clients_lambda.function,
        this.get_all_users_lambda.function,
        this.get_all_live_campaigns_lambda.function,
        this.get_total_reach_lambda.function,
        this.get_total_qrs_printed_lambda.function,
        this.get_total_qrs_printed_db_lambda.function,
        this.admin_clients_check_and_save.function,
      ].forEach(f => add_inspector_tags_to_function(f));
    }
  }
}
