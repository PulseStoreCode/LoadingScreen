// ── Config ──────────────────────────────────────────────────────────────────
const config = {
  serverName: "PulseFiveM",
  subtitle: "Chargement en cours",
  accentFrom: "#62e2eb",
  accentTo: "#8eedf3",
  discordColor: "#ffffff",
  images: [],
  music: {
    enabled: true,
    src: "assets/music/remix-theme-music.mp3"
  },
  durationMs: 7000
}

// ── DOM refs ─────────────────────────────────────────────────────────────────
const qs        = new URLSearchParams(location.search)
const handover  = window.nuiHandoverData || {}
const brand     = document.querySelector(".logo")
const subtitle  = document.querySelector(".subtitle")
const musicEl   = document.querySelector("#music")
const pctEl     = document.getElementById('progress-pct')
const cursorDot = document.getElementById('cursor-dot')
const cursorRing= document.getElementById('cursor-ring')

const slides = {
  panel:   document.querySelector(".panel"),
  current: document.querySelector(".slide.current"),
  next:    document.querySelector(".slide.next"),
  stripes: document.querySelector(".stripes")
}
const backdrop = {
  current: document.querySelector("#backdrop .bg.current"),
  next:    document.querySelector("#backdrop .bg.next")
}
const infotips = {
  current: document.querySelector(".infobar .itip.current"),
  next:    document.querySelector(".infobar .itip.next")
}

// ── Query params override ────────────────────────────────────────────────────
if (qs.get("name"))     config.serverName = qs.get("name")
if (qs.get("subtitle")) config.subtitle   = qs.get("subtitle")
if (qs.get("from"))     config.accentFrom = qs.get("from")
if (qs.get("to"))       config.accentTo   = qs.get("to")

brand.textContent    = config.serverName
subtitle.textContent = config.subtitle
document.documentElement.style.setProperty("--accent",   config.accentFrom)
document.documentElement.style.setProperty("--accent-2", config.accentTo)

const serverLogoEl = document.querySelector(".server-logo img")
if (serverLogoEl) {
  serverLogoEl.src = "assets/image/server-logo.png"
  serverLogoEl.onerror = () => {
    const wrap = document.querySelector(".server-logo")
    if (wrap) wrap.style.display = "none"
  }
}
const discordBannerEl = document.querySelector(".discord-banner")
if (discordBannerEl) {
  discordBannerEl.textContent = qs.get("discord") || handover.discordInvite || "DISCORD.GG/PULSEFIVEM"
  discordBannerEl.style.color = config.discordColor
}

// ── Custom cursor ────────────────────────────────────────────────────────────
let dotX = 0, dotY = 0, ringX = 0, ringY = 0
document.addEventListener('mousemove', (e) => {
  dotX = e.clientX; dotY = e.clientY
  cursorDot.style.left = dotX + 'px'
  cursorDot.style.top  = dotY + 'px'
})
document.addEventListener('mousedown', () => {
  cursorRing.classList.add('click')
  setTimeout(() => cursorRing.classList.remove('click'), 400)
})

// ── Panel drag ───────────────────────────────────────────────────────────────
let userControlActive = false
let flipBase = 0
let drag = { startX: 0, startY: 0, rotX: 0, rotY: 0, ptrId: null }

function applyUserTransform(rx, ry) {
  const rX = Math.max(-25, Math.min(25, rx))
  const rY = Math.max(-25, Math.min(25, ry))
  slides.panel.style.transform =
    `translate(-50%,-50%) rotate(var(--panel-tilt)) rotateY(${flipBase}deg) rotateX(${rX}deg) rotateY(${rY}deg)`
}
function toggleFlip() {
  flipBase = flipBase === 0 ? 180 : 0
  slides.panel.classList.toggle("flipped", flipBase === 180)
  if (userControlActive) applyUserTransform(drag.rotX, drag.rotY)
}
function onPointerDown(e) {
  if (e.target.closest('.music-player-fixed')) return
  if (e.target.closest('.top-nav')) return
  if (e.target.closest('.overlay')) return
  userControlActive = true
  slides.panel.classList.add("user-control")
  drag.startX = e.clientX; drag.startY = e.clientY
  drag.rotX = 0; drag.rotY = 0; drag.ptrId = e.pointerId
}
function onPointerMove(e) {
  if (!userControlActive) return
  drag.rotX = -(e.clientY - drag.startY) * 0.15
  drag.rotY =  (e.clientX - drag.startX) * 0.15
  applyUserTransform(drag.rotX, drag.rotY)
}
function endUserControl() {
  if (!userControlActive) return
  userControlActive = false
  slides.panel.classList.remove("user-control")
  slides.panel.style.transform = ""
  drag.ptrId = null
}
slides.panel.addEventListener("pointerdown", onPointerDown)
window.addEventListener("pointermove", onPointerMove)
window.addEventListener("pointerup", endUserControl)
slides.panel.addEventListener("dblclick", toggleFlip)

// ── FiveM loading progress ───────────────────────────────────────────────────
// FiveM sends loadProgress via NUI messages
// Fallback: animate on its own if no message received
let realProgress = null

window.addEventListener('message', (e) => {
  const data = e.data
  if (!data) return

  // FiveM standard: { eventName: "loadProgress", loadFraction: 0.0-1.0 }
  if (data.eventName === 'loadProgress') {
    realProgress = Math.floor((data.loadFraction ?? 0) * 100)
  }

  // FiveM: loading complete
  if (data.eventName === 'loadingScreenOff') {
    realProgress = 100
  }

  // Fallback formats some resources use
  if (data.type === 'loadProgress' && typeof data.progress === 'number') {
    realProgress = Math.floor(data.progress * 100)
  }
})
let progress = 0
let start    = performance.now()
let analyserRef   = null
let vizCanvasCtx  = null
let vizBufLen     = 0
let vizData       = null

// Loading steps — un seul visible à la fois, sync avec vrai chargement
const loadSteps = [
  { threshold: 0,  text: 'Initializing engine...' },
  { threshold: 12, text: 'Loading shaders...' },
  { threshold: 25, text: 'Streaming textures...' },
  { threshold: 40, text: 'Compiling scripts...' },
  { threshold: 55, text: 'Loading map data...' },
  { threshold: 68, text: 'Syncing server state...' },
  { threshold: 80, text: 'Spawning entities...' },
  { threshold: 92, text: 'Finalizing world...' },
]
const stepsContainer = document.getElementById('loader-steps')
let lastStepIndex = -1
let activeStepEl  = null

function updateLoadSteps(p) {
  // Find current step index
  let currentIndex = 0
  for (let i = 0; i < loadSteps.length; i++) {
    if (p >= loadSteps[i].threshold) currentIndex = i
  }

  if (currentIndex === lastStepIndex) return
  lastStepIndex = currentIndex

  // Fade out old step
  if (activeStepEl) {
    const old = activeStepEl
    old.classList.add('fade-out')
    setTimeout(() => old.remove(), 300)
  }

  // Create new step
  const el = document.createElement('div')
  el.className = 'loader-step'
  el.textContent = loadSteps[currentIndex].text
  stepsContainer.innerHTML = ''
  stepsContainer.appendChild(el)
  requestAnimationFrame(() => el.classList.add('active'))
  activeStepEl = el
}

function mainLoop(now) {
  // Progress ring — use real FiveM progress if available, else fake timer
  const ratio = Math.min(1, (now - start) / config.durationMs)
  progress = realProgress !== null ? realProgress : Math.floor(ratio * 100)
  document.documentElement.style.setProperty("--p", progress)
  if (pctEl) pctEl.textContent = progress + '%'
  if (ratio >= 1) start = now
  updateLoadSteps(progress)

  // Cursor ring lerp
  ringX += (dotX - ringX) * 0.12
  ringY += (dotY - ringY) * 0.12
  cursorRing.style.left = ringX + 'px'
  cursorRing.style.top  = ringY + 'px'

  // Audio visualizer
  if (analyserRef && vizCanvasCtx) {
    analyserRef.getByteFrequencyData(vizData)
    vizCanvasCtx.clearRect(0, 0, 40, 20)
    for (let i = 0; i < 10; i++) {
      const val = vizData[Math.floor(i * vizBufLen / 10)] / 255
      const h   = Math.max(2, val * 20)
      vizCanvasCtx.fillStyle = `rgba(255,255,255,${0.4 + val * 0.6})`
      vizCanvasCtx.fillRect(i * 4, 20 - h, 3, h)
    }
  }

  requestAnimationFrame(mainLoop)
}
requestAnimationFrame(mainLoop)

// ── Background slideshow ─────────────────────────────────────────────────────
function preload(src) {
  return new Promise(resolve => {
    const img = new Image()
    img.onload  = () => resolve(src)
    img.onerror = () => resolve(null)
    img.src = src
  })
}
async function discoverImages(max = 20, dir = "assets/image") {
  const found = []
  for (let i = 1; i <= max; i++) {
    const r = await preload(`${dir}/bg${i}.jpg`)
    if (r) found.push(r)
  }
  return found
}
async function setupBackground() {
  let loaded = config.images && config.images.length
    ? (await Promise.all(config.images.map(preload))).filter(Boolean)
    : await discoverImages(20)
  if (!loaded.length) return

  let i = 0
  slides.current.style.backgroundImage  = `url('${loaded[0]}')`
  backdrop.current.style.backgroundImage = `url('${loaded[0]}')`

  const tips = Array.isArray(handover.infoTips) && handover.infoTips.length
    ? handover.infoTips
    : [
        "Create your bank account at the Central Bank",
        "Visit the DMV to get your driver's license",
        "Use your phone to call a taxi or EMS",
        "Attend driving school to improve your skills",
        "Respect traffic laws and speed limits",
        "Buy a radio to communicate with your friends",
        "Check the job listings to find employment",
        "Doctors are available at the main hospital",
        "Protect your belongings with locks and alarms",
        "Avoid red zones if you are a beginner"
      ]
  let t = 0
  infotips.current.textContent = tips[0]

  function runWipe(onEnd) {
    slides.stripes.innerHTML = ""
    const el = document.createElement("div")
    el.className = "wipe"
    slides.stripes.appendChild(el)
    slides.panel.classList.add("flash")
    el.addEventListener("animationend", () => {
      slides.stripes.innerHTML = ""
      slides.panel.classList.remove("flash")
      if (typeof onEnd === "function") onEnd()
    }, { once: true })
  }

  function swap() {
    if (loaded.length <= 1) return
    const ni = (i + 1) % loaded.length
    const nt = (t + 1) % tips.length
    slides.next.style.backgroundImage   = `url('${loaded[ni]}')`
    backdrop.next.style.backgroundImage = `url('${loaded[ni]}')`
    infotips.next.textContent = tips[nt]
    slides.next.classList.add("reveal-in")
    slides.current.classList.add("reveal-out")
    if (!userControlActive && !slides.panel.classList.contains("flipped"))
      slides.panel.classList.add("pulse")
    backdrop.next.classList.add("fade-in")
    backdrop.current.classList.add("fade-out")
    infotips.next.classList.add("fade-in")
    infotips.current.classList.add("fade-out")
    setTimeout(() => {
      slides.current.classList.remove("reveal-out")
      slides.next.classList.remove("reveal-in")
      slides.panel.classList.remove("pulse")
      backdrop.next.classList.remove("fade-in")
      backdrop.current.classList.remove("fade-out")
      infotips.next.classList.remove("fade-in")
      infotips.current.classList.remove("fade-out")
      slides.current.style.backgroundImage   = slides.next.style.backgroundImage
      backdrop.current.style.backgroundImage = backdrop.next.style.backgroundImage
      infotips.current.textContent = tips[nt]
      i = ni; t = nt
    }, 1200)
  }

  function cycle() {
    start = performance.now()
    runWipe(() => swap())
  }
  cycle()
  setInterval(cycle, 7000)
}
setupBackground()

// ── Music player ─────────────────────────────────────────────────────────────
function setupMusic() {
  if (!config.music.enabled || !config.music.src) return
  musicEl.src  = config.music.src
  musicEl.loop = true

  const saved = localStorage.getItem('ls_volume')
  musicEl.volume = saved !== null ? parseFloat(saved) : 0.5

  const ppBtn      = document.getElementById('pp-btn')
  const playIcon   = ppBtn.querySelector('.play-icon')
  const pauseIcon  = ppBtn.querySelector('.pause-icon')
  const volUp      = document.getElementById('vol-up')
  const volDown    = document.getElementById('vol-down')
  const volBarFill = document.getElementById('vol-bar-fill')
  const vizCanvas  = document.getElementById('viz-canvas')
  const equalizerEl= document.getElementById('equalizer')

  function updateVolBar() {
    if (volBarFill) volBarFill.style.width = (musicEl.volume * 100) + '%'
  }
  updateVolBar()

  let audioCtx, audioSource
  function setupAnalyser() {
    if (audioCtx) return
    audioCtx    = new (window.AudioContext || window.webkitAudioContext)()
    analyserRef = audioCtx.createAnalyser()
    analyserRef.fftSize = 64
    vizBufLen   = analyserRef.frequencyBinCount
    vizData     = new Uint8Array(vizBufLen)
    if (vizCanvas) vizCanvasCtx = vizCanvas.getContext('2d')
    audioSource = audioCtx.createMediaElementSource(musicEl)
    audioSource.connect(analyserRef)
    analyserRef.connect(audioCtx.destination)
  }

  function updateState(playing) {
    playIcon.style.display  = playing ? 'none'  : 'block'
    pauseIcon.style.display = playing ? 'block' : 'none'
    if (equalizerEl) equalizerEl.style.opacity = playing ? '1' : '0.3'
    if (playing) {
      setupAnalyser()
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume()
    }
  }

  function changeVolume(delta) {
    const next = Math.min(1, Math.max(0, musicEl.volume + delta))
    musicEl.volume = next
    localStorage.setItem('ls_volume', String(next))
    updateVolBar()
  }

  ppBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    if (musicEl.paused) musicEl.play().then(() => updateState(true)).catch(console.error)
    else { musicEl.pause(); updateState(false) }
  })
  ppBtn.addEventListener('pointerdown', (e) => e.stopPropagation())

  if (volUp) {
    volUp.addEventListener('click', (e) => { e.stopPropagation(); changeVolume(0.1) })
    volUp.addEventListener('pointerdown', (e) => e.stopPropagation())
    volUp.addEventListener('mouseenter', () => { cursorDot.style.opacity = '0'; cursorRing.style.opacity = '0' })
    volUp.addEventListener('mouseleave', () => { cursorDot.style.opacity = '1'; cursorRing.style.opacity = '1' })
  }
  if (volDown) {
    volDown.addEventListener('click', (e) => { e.stopPropagation(); changeVolume(-0.1) })
    volDown.addEventListener('pointerdown', (e) => e.stopPropagation())
    volDown.addEventListener('mouseenter', () => { cursorDot.style.opacity = '0'; cursorRing.style.opacity = '0' })
    volDown.addEventListener('mouseleave', () => { cursorDot.style.opacity = '1'; cursorRing.style.opacity = '1' })
  }

  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'KeyM') {
      e.preventDefault()
      if (musicEl.paused) musicEl.play().then(() => updateState(true)).catch(console.error)
      else { musicEl.pause(); updateState(false) }
    } else if (e.code === 'ArrowUp') {
      e.preventDefault(); changeVolume(0.05)
    } else if (e.code === 'ArrowDown') {
      e.preventDefault(); changeVolume(-0.05)
    }
  })

  const run = () => musicEl.play().then(() => updateState(true)).catch(() => updateState(false))
  run()
  document.addEventListener("click", (e) => {
    if (!e.target.closest('.music-player') && musicEl.paused) run()
  }, { once: true })
}
setupMusic()

// ── Overlays ──────────────────────────────────────────────────────────────
function setupOverlays() {
  const allOverlays = document.querySelectorAll('.overlay')
  const allBtns     = document.querySelectorAll('.nav-btn')

  function closeAll() {
    allOverlays.forEach(o => o.classList.remove('open'))
    allBtns.forEach(b => b.classList.remove('active'))
  }

  allBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      const target  = document.getElementById('overlay-' + btn.dataset.overlay)
      const isOpen  = target.classList.contains('open')
      closeAll()
      if (!isOpen) {
        target.classList.add('open')
        btn.classList.add('active')
      }
    })
    btn.addEventListener('pointerdown', (e) => e.stopPropagation())
  })

  document.querySelectorAll('.overlay-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      closeAll()
    })
    btn.addEventListener('pointerdown', (e) => e.stopPropagation())
  })
}
setupOverlays()

// ── Populate overlays from handover data ─────────────────────────────────
function populateOverlays() {
  // Patch Notes
  if (handover.patchNotes) {
    const pn = handover.patchNotes
    const vEl = document.querySelector('.patch-version')
    if (vEl && pn.version) vEl.textContent = pn.version + ' — Latest'
    const ul = document.querySelector('#overlay-patch-notes .overlay-content ul')
    if (ul && pn.entries && pn.entries.length) {
      ul.innerHTML = pn.entries.map(e => `<li>${e}</li>`).join('')
    }
  }

  // Base Rules
  if (handover.baseRules && handover.baseRules.length) {
    const ul = document.querySelector('#overlay-base-rules .overlay-content ul')
    if (ul) ul.innerHTML = handover.baseRules.map(r => `<li>${r}</li>`).join('')
  }

  // Staff
  if (handover.staff && handover.staff.length) {
    const list = document.querySelector('.staff-list')
    if (list) {
      list.innerHTML = handover.staff.map(s =>
        `<div class="staff-entry">
          <span class="staff-role ${s.role}">${s.role}</span>
          <span class="staff-name">${s.name}</span>
        </div>`
      ).join('')
    }
  }
}
populateOverlays()
