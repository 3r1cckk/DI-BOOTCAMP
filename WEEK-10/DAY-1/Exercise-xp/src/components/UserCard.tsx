interface UserCardProps {
  name?: string
  age?: number
  role?: string
}

function UserCard({
  name = 'Alex Morgan',
  age = 28,
  role = 'Frontend learner',
}: UserCardProps) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <article className="mini-user-card">
      <span className="mini-avatar" aria-hidden="true">{initials}</span>
      <div className="mini-user-details">
        <h4>{name}</h4>
        <p>{role}</p>
      </div>
      <span className="age-tag">{age} yrs</span>
    </article>
  )
}

export default UserCard
