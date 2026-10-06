import { Component } from 'react'
import data from '../data/data.json'

export default class Example3 extends Component {
  render() {
    return (
      <div className="experience-list">
        {data.Experiences.map((experience) => (
          <div className="experience-card" key={experience.companyName}>
            <img alt="" className="company-logo" src={experience.logo} />
            <div className="experience-details">
              <h3>
                <a href={experience.url} target="_blank" rel="noreferrer">
                  {experience.companyName}
                </a>
              </h3>
              {experience.roles.map((role) => (
                <div className="role" key={`${experience.companyName}-${role.title}`}>
                  <h4>{role.title}</h4>
                  <p>{role.description}</p>
                  <p className="role-meta">
                    {role.startDate} – {role.endDate} · {role.location}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }
}
