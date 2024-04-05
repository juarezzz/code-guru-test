export namespace CDK {
  export interface Context {
    web_analytics_domain: string;
    api_domain_name: string;
    pipe_domain_name: string;
    backend_branch_name: string;
    bucket_name: string;
    domain_name: string;
    admin_domain_name: string;
    project_name: string;
    redirect_url: string;
    admin_redirect_url: string;
    third_party_redirect_url: string;
    rc_portal_redirect_url: string;
    printer_portal_redirect_url: string;
    region: string;
    resolver_domain_name: string;
    resolver_url: string;
    secret_name: string;
    table_name: string;
    labels_table_name: string;
    userpool: string;
    google_analytics_id: string;
    timestream_name: string;
    timestream_logs_name: string;
    rc_portal_domain_name: string;
    printer_domain_name: string;
    webiny_api_url: string;
    web_teardown_handler: string;
    web_admin_teardown_handler: string;
    web_printer_portal_teardown_handler: string;
    web_rc_portal_teardown_handler: string;
    logs_queue_name: string;
    mixpanel_proxy_domain_name: string;
  }
}
