(() => {
  const cards = [...document.querySelectorAll('[data-resource-type]')];
  const buttons = [...document.querySelectorAll('[data-resource-filter]')];
  const search = document.querySelector('#resource-search');
  if (!search) return;
  const requested = new URLSearchParams(location.search).get('category');
  let category = ['article','story','video','demo'].includes(requested) ? requested : 'all';
  function update() {
    const term = search.value.trim().toLocaleLowerCase();
    let count = 0;
    for (const card of cards) {
      const visible = (category === 'all' || card.dataset.resourceType === category) && card.textContent.toLocaleLowerCase().includes(term);
      card.hidden = !visible;
      if (visible) count++;
    }
    for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.resourceFilter === category));
    document.querySelector('#resource-count').textContent = `${count} ${count === 1 ? 'resource' : 'resources'}`;
    document.querySelector('#resource-empty').hidden = count !== 0;
  }
  buttons.forEach(button => button.addEventListener('click', () => { category = button.dataset.resourceFilter; update(); }));
  search.addEventListener('input', update);
  document.querySelector('#resource-reset').addEventListener('click', () => {category = 'all'; search.value = ''; update(); search.focus();});
  update();
})();
