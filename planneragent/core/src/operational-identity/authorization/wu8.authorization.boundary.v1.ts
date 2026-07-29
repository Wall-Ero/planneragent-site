import type {
  FileAcquisitionAuthorization,
  SecureFileAcquisitionServices,
} from "../../industrial/acquisition/secure.file.acquisition";
import type { GovernedUploadOperationalContextV1 } from "../contracts/track-a.v1";
import { identifier } from "../contracts/identifiers.v1";
import type { GovernedUploadAuthorizationRuntime } from "./authorization.runtime.v1";

export function createWu8UploadAuthorizationBoundary(
  runtime: GovernedUploadAuthorizationRuntime,
  context: GovernedUploadOperationalContextV1,
): Pick<SecureFileAcquisitionServices, "authorize"> {
  return Object.freeze({
    async authorize(request): Promise<FileAcquisitionAuthorization> {
      try {
        await runtime.consume(context, {
          authorization_decision_id: context.authorization_decision_id,
          upload_id: identifier("UploadId", request.uploadId),
          principal_id: context.principal_id,
          session_id: context.session_id,
          membership_id: context.membership_id,
          company_id: identifier("CompanyId", request.companyId),
          tenant_id: identifier("TenantId", request.tenantId),
          resource: context.resource,
          purpose: context.purpose,
          correlation_id: identifier("CorrelationId", `wu8:${context.authorization_decision_id}`),
        });
        return Object.freeze({
          authorized: true,
          uploadId: request.uploadId,
          tenantId: request.tenantId,
          companyId: request.companyId,
          authorizationReference: context.authorization_decision_id,
        });
      } catch {
        return Object.freeze({
          authorized: false,
          uploadId: request.uploadId,
          tenantId: request.tenantId,
          companyId: request.companyId,
        });
      }
    },
  });
}
