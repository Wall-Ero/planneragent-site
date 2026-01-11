import { LlmProvider } from "./types";
import { createOpenRouterProvider } from "./providers/openrouter";
import { OssProvider } from "./providers/oss";
import { MockProvider } from "./providers/mock";

export function createProviderMap(env: any): Record<string, LlmProvider> {
  return {
    openrouter: createOpenRouterProvider(env),
    oss: OssProvider,
    mock: MockProvider,
  };
}