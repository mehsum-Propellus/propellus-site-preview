document.addEventListener('DOMContentLoaded', () => {
  const journey = new URLSearchParams(location.search).get('journey');
  if (!['traveller','agency','supplier','bridge'].includes(journey)) return;
  document.getElementById('demo-tab-' + journey)?.click();
});
