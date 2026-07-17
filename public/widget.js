/**
 * Sayniir chat widget — embeddable floating button that deep-links a
 * website visitor into an Instagram/Messenger/WhatsApp DM.
 * Usage: <script src="https://YOUR_DOMAIN/widget.js" data-platform="instagram" data-target="username" async></script>
 */
;(function () {
  var scripts = document.getElementsByTagName('script')
  var current = scripts[scripts.length - 1]
  var platform = current.getAttribute('data-platform') || 'instagram'
  var target = current.getAttribute('data-target') || ''
  var color = current.getAttribute('data-color') || '#6366f1'
  if (!target) return

  var urls = {
    instagram: 'https://ig.me/m/' + target,
    messenger: 'https://m.me/' + target,
    whatsapp: 'https://wa.me/' + target,
  }
  var href = urls[platform] || urls.instagram

  var btn = document.createElement('a')
  btn.href = href
  btn.target = '_blank'
  btn.rel = 'noopener noreferrer'
  btn.setAttribute('aria-label', 'Discuter avec nous')
  btn.style.cssText = [
    'position:fixed', 'bottom:20px', 'right:20px', 'z-index:2147483000',
    'width:56px', 'height:56px', 'border-radius:50%',
    'background:' + color, 'display:flex', 'align-items:center', 'justify-content:center',
    'box-shadow:0 4px 14px rgba(0,0,0,.25)', 'cursor:pointer', 'text-decoration:none',
  ].join(';')
  btn.innerHTML =
    '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>'

  document.addEventListener('DOMContentLoaded', function () {
    document.body.appendChild(btn)
  })
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    document.body.appendChild(btn)
  }
})()
