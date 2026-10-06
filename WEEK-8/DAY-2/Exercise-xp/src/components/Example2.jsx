import { Component } from 'react'
import data from '../data/data.json'

export default class Example2 extends Component {
  render() {
    return (
      <div className="skill-groups">
        {data.Skills.map((group) => (
          <section className="skill-group" key={group.Area}>
            <h3>{group.Area}</h3>
            <ul>
              {group.SkillSet.map((skill) => (
                <li key={skill.Name}>
                  <span>{skill.Name}</span>
                  {skill.Hot && <span className="hot-badge">Hot</span>}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    )
  }
}
