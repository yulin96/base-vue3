const currentUrl = new URL(window.location.href)

if (currentUrl.searchParams.has('t')) {
  currentUrl.searchParams.delete('t')
  history.replaceState(history.state, '', currentUrl.toString())
}
