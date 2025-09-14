import { ProviderRegistry } from '../src/services/BaseProvider'
import { createOpenAIConfig } from '../src/providers/openai'
import CopilotAgent from '../src/agent/CopilotAgent'
import { createOrchestratorConfig } from '../src/agent/orchestrate'

async function main() {
  const provider = ProviderRegistry.getProvider('openai')!.factory(createOpenAIConfig())

  const child = new CopilotAgent(provider as any, {
    name: 'Operations', slug: 'ops', firstMessage: 'Ready.', systemPrompt: 'You are the Ops child.', fallbackMessage: 'Sorry.'
  } as any, {
    system_prompts: ['You are helpful operations assistant.']
  })

  const masterCfg = {
    system_prompts: ['You are a master orchestrator.'],
    briefFormatter: ({ lastUserMessage, chosenChildName }: any) => `Delegation Brief for ${chosenChildName}:\nUser asked: ${lastUserMessage}\nReturn a concise, final answer.`,
    routingPolicy: {
      allowParallelChildren: false,
      rules: [{ match: ({ text }: any) => /list|create|update|delete/i.test(text), forceTool: { name: 'Operations' } }]
    },
    observability: { correlationId: 'demo-run-1' }
  } as any

  const orchestrated = createOrchestratorConfig(masterCfg as any, [ { name: 'Operations', agent: child } ], {
    preDelegate: (ctx) => (masterCfg as any).briefFormatter!(ctx),
    seedPersistentChild: true
  })

  // Invoke the child via tool runner
  const runner = (orchestrated.toolRunners as any)['Operations']
  const result = await runner({ input: 'List all pending invoices for ACME.' })
  console.log('Child result:', result)
}

main().catch(err => console.error(err))


