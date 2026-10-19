interface GreetingProps {
  name: string
  messageCount: number
}

function Greeting({ name, messageCount }: GreetingProps) {
  const messageLabel = messageCount === 1 ? 'message' : 'messages'

  return (
    <div className="greeting-card">
      <span className="greeting-avatar" aria-hidden="true">
        {name.charAt(0).toUpperCase()}
      </span>
      <div>
        <p className="greeting-overline">YOUR INBOX</p>
        <p className="greeting-title">Hey, {name}!</p>
        <p className="greeting-subtitle">
          You have <strong>{messageCount}</strong> new {messageLabel}.
        </p>
      </div>
      <span className="message-badge" aria-label={`${messageCount} new ${messageLabel}`}>
        {messageCount}
      </span>
    </div>
  )
}

export default Greeting
