const sections = [
  { id: 'section-about',    src: 'sections/about.html' },
  { id: 'section-stack',    src: 'sections/stack.html' },
  { id: 'section-unique',   src: 'sections/unique.html' },
  { id: 'section-about-more', src: 'sections/about-more.html' },
  { id: 'timeline', src: 'sections/timeline.html' },
  { id: 'section-projects',   src: 'sections/projects.html', onLoad: loadProjects },
  { id: 'section-contact',    src: 'sections/contact.html' },
];

sections.forEach(({ id, src, onLoad }) => {
  const placeholder = document.getElementById(id);
  if (!placeholder) return;
  fetch(src)
    .then(res => res.text())
    .then(html => {
      placeholder.outerHTML = html;
      if (onLoad) onLoad();
    })
    .catch(err => console.error(`Failed to load ${src}:`, err));
});

function loadProjects() {
  fetch('data/projects.json')
    .then(res => res.json())
    .then(projects => {
      const grid = document.getElementById('projects-grid');
      if (!grid) return;
      grid.innerHTML = projects.map(project => `
        <div class="project-card ${project.live ? 'project-card--clickable' : ''}"
          ${project.live ? `onclick="window.open('${project.live}','_blank','noopener')"` : ''}>
          <img class="project-img" src="${project.image}" alt="${project.name}" />
          <div class="project-info">
            <h3 class="project-name">${project.name}</h3>
            <p class="project-desc">${project.description}</p>
            ${project.tools?.length ? `
            <div class="project-tools">
              ${project.tools.map(t => `<span class="project-tool">${t}</span>`).join('')}
            </div>` : ''}
            <div class="project-links">
              ${project.github ? `<a href="${project.github}" class="project-link" target="_blank" rel="noopener" onclick="event.stopPropagation()">GitHub</a>` : ''}
            </div>
          </div>
        </div>
      `).join('');
    })
    .catch(err => console.error('Failed to load projects.json:', err));
}

