import posts from '../data/posts.json'

export default function PostList() {
  return (
    <div className="post-list">
      {posts.map((post) => (
        <article className="post-card" key={post.id}>
          <p className="section-kicker">POST {String(post.id).padStart(2, '0')}</p>
          <h3>{post.title}</h3>
          <p>{post.content}</p>
        </article>
      ))}
    </div>
  )
}
