export interface HttpFailure {
  status?: number;
  headers?: Record<string, string | undefined>;
  data?: any;
  config?: { url?: string };
}

export interface ErrorDiagnostics {
  messages(rejection: HttpFailure): string[];
}

/**
 * Translates JIRA HTTP failure responses into localized error messages.
 */
export class JiraErrorFormatter implements ErrorDiagnostics {
  private readonly translate: (key: string) => string;

  constructor(translate: (key: string) => string) {
    this.translate = translate;
    Object.freeze(this);
  }

  messages(rejection: HttpFailure): string[] {
    if (!rejection || !rejection.status) {
      return [this.translate('jiraApiConnectionProblem')];
    }
    const headers = rejection.headers ?? {};
    const reasons: Record<string, string> = {
      AUTHENTICATION_DENIED: 'jiraApiAuthenticationDenied',
      AUTHENTICATED_FAILED: 'jiraApiAuthenticationFailed',
      AUTHORISATION_FAILED: 'jiraApiAuthorizationFailed',
      OUT: 'jiraApiLoggedOut'
    };
    const denied = headers['x-authentication-denied-reason'];
    const reason = headers['x-seraph-loginreason'];
    if (denied) {
      return [denied];
    }
    if (reason && rejection.status > 400 && rejection.status < 500) {
      return [this.translate(reasons[reason])];
    }
    if (rejection.status === 500) {
      return [this.translate('jiraApiCheckConfig')];
    }
    if (rejection.data && Array.isArray(rejection.data.errorMessages)) {
      return rejection.data.errorMessages;
    }
    if (rejection.data && rejection.data.message) {
      return [String(rejection.data.message)];
    }
    return [this.translate('jiraApiUknownResponse'), this.translate('jiraApiCheckSettings')];
  }
}
