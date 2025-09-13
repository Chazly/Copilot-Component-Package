import React from 'react'
import type { CopilotAgent } from '../agent/CopilotAgent'
import type { Message } from '../types'

export function AgentChatUI({ agent }: { agent: CopilotAgent }) {
  const [messages, setMessages] = React.useState<Message[]>(agent.getMessages())
  const [input, setInput] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    const onMessage = () => setMessages(agent.getMessages())
    const onLoading = (v: boolean) => setLoading(v)
    agent.on('message', onMessage)
    agent.on('loading', onLoading)
  }, [agent])

  return (
    <div className="flex flex-col h-full border border-gray-200 rounded-lg">
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          {agent.avatarUrl && <img src={agent.avatarUrl} className="w-6 h-6 rounded-full" />}
          <div>
            <div className="font-semibold text-sm">{agent.name}</div>
            <div className="text-[11px] text-gray-500">{agent.description}</div>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-3 space-y-2">
        {messages.map(m => (
          <div key={m.id} className={m.sender === 'user' ? 'text-right' : 'text-left'}>
            <span className={`inline-block px-3 py-2 rounded ${m.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}>{m.content}</span>
          </div>
        ))}
        {loading && <div className="text-gray-500 text-xs">Thinking…</div>}
      </div>
      <div className="p-2 border-t border-gray-200 flex gap-2">
        <input className="flex-1 border px-2 py-1 rounded text-sm" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && agent.send(input)} />
        <button className="px-3 py-1 bg-black text-white rounded text-sm" onClick={() => agent.send(input)}>Send</button>
      </div>
    </div>
  )
}

export default AgentChatUI


