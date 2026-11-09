import { createInterface } from "node:readline/promises";
import { types } from "node:util";
import { inspectLiveTransportAvailabilityV1, LIVE_NETWORK_ENABLED_V1, denyRealDispatchV1, OneShotTransportErrorV1 } from "./live.contracts";
import { nativeAuthorizationChallengeV1, nativeAuthorizationPhraseV1, inspectNativeGateOpeningV1, requireNativeLocalInputBoundsV1,
  nativeHostedInputAcknowledgmentPhraseV1, requireNativeHostedInputAcknowledgmentV1 } from "./live.authorization";
import { runNativeLiveTransportExperimentV1 } from "./live.transport";

function classifyTerminalError(error: unknown): string {
  // Never evaluate untrusted getters, stringify exceptions, or accept arbitrary codes.
  const fallback = "UNCLASSIFIED_LOCAL_FAILURE";
  try {
    if (types.isProxy(error) || !types.isNativeError(error)) return fallback;
    const descriptors = Object.getOwnPropertyDescriptors(error);
    // Some Node runtimes expose native Error.stack as an accessor, even after assignment.
    // Recognize that exact built-in descriptor without reading the stack or invoking it.
    const nativeStack = Object.getOwnPropertyDescriptor(new Error(), "stack");
    if (Reflect.ownKeys(descriptors).some(key => {
      const descriptor = descriptors[key as string];
      if ("value" in descriptor) return false;
      return key !== "stack" || !nativeStack || "value" in nativeStack ||
        descriptor.get !== nativeStack.get || descriptor.set !== nativeStack.set ||
        descriptor.enumerable !== nativeStack.enumerable || descriptor.configurable !== nativeStack.configurable;
    })) return fallback;
    const code = descriptors.code;
    const message = descriptors.message;
    if (error instanceof OneShotTransportErrorV1) {
      return [
        "REAL_DISPATCH_DISABLED_STEP13J", "LOCAL_INPUT_BOUNDS_INVALID",
        "INTERACTIVE_CONSOLE_REQUIRED", "HOSTED_INPUT_RISK_ACKNOWLEDGMENT_REQUIRED",
        "DEDICATED_TOKEN_EXPIRED_OR_REVERIFY_REQUIRED", "EXPLICIT_EXPERIMENT_AUTHORIZATION_REQUIRED",
        "ATTEMPT_ALREADY_RESERVED", "CREDENTIAL_ENTRY_CANCELLED_OR_INVALID",
        "MANIFEST_INVALID", "DEDICATED_AUTHORIZATION_REQUIRED", "INPUT_TOO_LARGE", "EXPOSURE_DENIED",
        "RESERVATION_DENIED_OR_STORAGE_UNAVAILABLE", "DISPATCH_PERMISSION_DENIED",
        "TERMINAL_RECEIPT_UNAVAILABLE_NO_RETRY",
      ].find(known => known === code?.value) ?? fallback;
    }
    return [
      "ARGUMENTS_DENIED", "INTERACTIVE_CONSOLE_REQUIRED", "ONE_SHOT_PAYLOAD_REVIEW_REQUIRED",
      "NATURAL_CAPABILITIES_SOURCE_REVIEW_REQUIRED",
    ].find(known => known === message?.value) ?? fallback;
  } catch { return fallback; }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === "--inspect") {
    console.log(JSON.stringify({ ...inspectLiveTransportAvailabilityV1(), challenge: nativeAuthorizationChallengeV1(),
      required_confirmation: nativeAuthorizationPhraseV1(), gate_opening: inspectNativeGateOpeningV1() }, null, 2)); return;
  }
  if (args.length !== 1 || args[0] !== "--execute") throw new Error("ARGUMENTS_DENIED");
  if (!LIVE_NETWORK_ENABLED_V1) denyRealDispatchV1();
  requireNativeLocalInputBoundsV1();
  if (!process.stdin.isTTY || !process.stdout.isTTY) throw new Error("INTERACTIVE_CONSOLE_REQUIRED");
  console.log(JSON.stringify(nativeAuthorizationChallengeV1(), null, 2));
  console.log("Verify Workers Free, no payment method, dedicated account token, no Gateway/prepaid route. Unknown quota is accepted only for this attempt; quota failure consumes it permanently.");
  const terminal = createInterface({ input: process.stdin, output: process.stdout });
  let confirmation: string, hostedInputAcknowledgment: string;
  try {
    hostedInputAcknowledgment = await terminal.question(`Hosted input count and template overhead are UNKNOWN. Provider rejection consumes the attempt. Type separately: ${nativeHostedInputAcknowledgmentPhraseV1()}\n`);
    requireNativeHostedInputAcknowledgmentV1(hostedInputAcknowledgment);
    confirmation = await terminal.question(`Type exactly: ${nativeAuthorizationPhraseV1()}\n`);
  }
  finally { terminal.close(); }
  await runNativeLiveTransportExperimentV1({ ...nativeAuthorizationChallengeV1(), confirmation,
    hosted_input_uncertainty_acknowledgment: hostedInputAcknowledgment });
  console.log("ATTEMPT_STOPPED_REVIEW_PRIVATE_JOURNAL_NO_RETRY");
}
main().catch(error => {
  console.error("ONE_SHOT_DENIED_OR_STOPPED_NO_RETRY");
  console.error(`ONE_SHOT_ERROR_CLASS=${classifyTerminalError(error)}`);
  process.exitCode = 1;
});
