import React from 'react'
import type { CopilotAgent } from '../agent/CopilotAgent'
import { Bot, User, Send } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'

// This mirrors the existing CopilotChat look-and-feel but reads state from the agent

const layout = {
  container: "flex flex-col bg-white h-96 w-full max-w-md border border-gray-200 rounded-lg shadow-sm",
  header: "px-4 py-3 border-b border-gray-200",
  messages: "flex-1 overflow-auto",
  messageText: "text-xs",
  timestampText: "text-[10px]",
  input: "p-4 border-t border-gray-200",
  inputField: "h-8 text-xs",
  button: "h-8 w-8",
  avatar: "h-6 w-6",
  avatarIcon: "h-3 w-3"
}

export function AgentCopilotChat({ agent, className }: { agent: CopilotAgent; className?: string }) {
  const [messages, setMessages] = React.useState(agent.getMessages())
  const [input, setInput] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    const onMsg = () => setMessages(agent.getMessages())
    const onLoad = (v: boolean) => setLoading(v)
    agent.on('message', onMsg)
    agent.on('loading', onLoad)
  }, [agent])

  const container = className || layout.container

  return (
    <div className={container}>
      <header className={`flex items-center gap-2 border-b border-gray-200 ${layout.header}`}>
        <span className={`flex ${layout.avatar} items-center justify-center rounded-full bg-blue-600`}>
          {agent.avatarUrl ? (
            <img src={agent.avatarUrl} alt="Avatar" className={`${layout.avatar} rounded-full object-cover`} />
          ) : (
            <Bot className={`${layout.avatarIcon} text-white`} />
          )}
        </span>
        <div className="flex-1">
          <h1 className={`font-semibold text-gray-900 text-sm`}>{agent.name || 'AI Assistant'}</h1>
          {agent.description && <p className={`text-gray-500 text-xs`}>{agent.description}</p>}
        </div>
      </header>
      <div className={`${layout.messages}`}>
        <div className={`space-y-3 p-4`}>
          {messages.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              <p className={'text-xs'}>Start a conversation to get help</p>
            </div>
          )}
          {messages.map((m: any) => (
            <div key={m.id} className={`flex items-start gap-2 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.sender === 'assistant' && (
                <div className={`${layout.avatar} rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0`}>
                  {agent.avatarUrl ? (
                    <img src={agent.avatarUrl} alt="Assistant" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <Bot className={`${layout.avatarIcon} text-gray-600`} />
                  )}
                </div>
              )}
              <div className={`max-w-[80%] rounded-lg px-3 py-2 ${m.sender === 'user' ? 'bg-white text-black' : 'bg-gray-100 text-gray-900'}`}>
                <div className={layout.messageText}>
                  {m.content}
                </div>
                {m.timestamp && (
                  <div className={`${layout.timestampText} opacity-70 mt-1 ${m.sender === 'user' ? 'text-gray-600' : 'text-gray-500'}`}>
                    {m.timestamp.toLocaleTimeString()}
                  </div>
                )}
              </div>
              {m.sender === 'user' && (
                <div className={`${layout.avatar} rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0`}>
                  <User className={`${layout.avatarIcon} text-white`} />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex items-start gap-2 justify-start">
              <div className={`${layout.avatar} rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0`}>
                {agent.avatarUrl ? (
                  <img src={agent.avatarUrl} alt="Assistant" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <Bot className={`${layout.avatarIcon} text-gray-600`} />
                )}
              </div>
              <div className="bg-gray-100 text-gray-900 rounded-lg px-3 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className={`border-t border-gray-200 ${layout.input}`}>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask ${agent.name || 'the copilot'}...`}
            onKeyDown={(e) => e.key === 'Enter' && !loading && agent.send(input)}
            className={`flex-1 ${layout.inputField}`}
            disabled={loading}
          />
          <Button
            onClick={() => agent.send(input)}
            size="sm"
            className={`${layout.button} p-0 bg-blue-600 hover:bg-blue-700`}
            disabled={loading}
          >
            <Send className={`${layout.avatarIcon}`} />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default AgentCopilotChat


