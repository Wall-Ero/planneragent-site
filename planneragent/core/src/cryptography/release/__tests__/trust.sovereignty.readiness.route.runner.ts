import { trustSovereigntyReadinessResponse } from "../trust.sovereignty.readiness.route";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`PASS: ${message}`);
}
async function run() {
  const valid = trustSovereigntyReadinessResponse({
    TRUSTED_SIGN_REPLAY_DB: {},
    TRUSTED_SIGN_EVIDENCE_DB: {},
    TRUSTED_SIGN_AWS_REGION: "eu-west-1",
    TRUSTED_SIGN_AWS_KMS_KEY_ARN:
      "arn:aws:kms:eu-west-1:111122223333:key/12345678-1234-1234-1234-123456789abc",
    TRUSTED_SIGN_AWS_CREDENTIAL_REFERENCE: "planneragent-workload-identity",
  });
  assert(valid.status === 200, "valid deployment configuration is ready");
  const body = await valid.json() as {
    architecture: string;
    productionIntegration: string;
    productionConfiguration: string;
  };
  assert(body.architecture === "COMPLETE" &&
    body.productionIntegration === "COMPLETE" &&
    body.productionConfiguration === "VALID",
    "readiness levels remain independently classified");
  const missing = trustSovereigntyReadinessResponse({});
  assert(missing.status === 503, "missing deployment configuration fails closed");
  const serialized = await missing.text();
  assert(!serialized.includes("credentialReference"),
    "readiness response exposes no credential reference");
  console.log("Trust Sovereignty readiness route runner completed.");
}
run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
