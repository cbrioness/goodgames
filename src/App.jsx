import { useEffect, useMemo, useRef, useState } from 'react'
import Logo from './Logo.jsx'
import { games } from './games.js'

const STORAGE_KEY = 'savepoint-shelves'
const gameIds = new Set(games.map((game) => game.id))

function loadShelves() {
  const empty = { toPlay: [], played: [] }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return empty
    const parsed = JSON.parse(raw)
    const played = Array.isArray(parsed.played)
      ? parsed.played
          .filter((entry) => entry && gameIds.has(entry.id))
          .map((entry) => ({
            id: entry.id,
            rating:
              Number.isInteger(entry.rating) && entry.rating >= 1 && entry.rating <= 5
                ? entry.rating
                : null,
          }))
      : []
    const playedIds = new Set(played.map((entry) => entry.id))
    const toPlay = Array.isArray(parsed.toPlay)
      ? parsed.toPlay.filter((id) => gameIds.has(id) && !playedIds.has(id))
      : []
    return { toPlay, played }
  } catch {
    return empty
  }
}

function Cover({ game, className }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div
        className={`grid place-items-center bg-gradient-to-br from-magenta/70 via-violet-700 to-neon/70 text-center font-display text-lg tracking-wide ${className}`}
      >
        {game.name}
      </div>
    )
  }

  return (
    <img
      src={game.cover}
      alt=""
      className={`object-cover ${className}`}
      onError={() => setFailed(true)}
    />
  )
}

function Stars({ value, onChange }) {
  return (
    <div className="flex gap-0.5" role="group" aria-label="Calificación">
      {[1, 2, 3, 4, 5].map((score) => {
        const filled = value != null && score <= value
        return (
          <button
            key={score}
            type="button"
            aria-label={value === score ? `Quitar ${score} estrellas` : `${score} estrellas`}
            aria-pressed={value === score}
            onClick={() => onChange(score)}
            className={`text-lg leading-none transition hover:scale-110 ${
              filled ? 'text-amber' : 'text-white/25 hover:text-amber/70'
            }`}
          >
            ★
          </button>
        )
      })}
    </div>
  )
}

function GameDetail({ game, onBack }) {
  return (
    <article className="overflow-hidden rounded-3xl border border-white/10 bg-panel/90 shadow-[0_0_40px_rgb(0_0_0/0.35)]">
      <div className="grid gap-6 p-4 sm:grid-cols-[16rem_minmax(0,1fr)] sm:p-6">
        <Cover game={game} className="aspect-[2/3] w-full rounded-2xl" />
        <div className="min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="mb-4 text-xs font-bold tracking-[0.2em] text-neon uppercase hover:text-white"
          >
            ← Volver al catálogo
          </button>
          <h2 className="bg-gradient-to-r from-white to-neon bg-clip-text font-display text-4xl text-transparent sm:text-5xl">
            {game.name}
          </h2>
          <p className="mt-4 max-w-prose text-white/80">{game.description}</p>
          <dl className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/30 px-3 py-3">
              <dt className="text-[11px] font-bold tracking-widest text-magenta uppercase">Género</dt>
              <dd className="mt-1 font-bold">{game.genre}</dd>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 px-3 py-3">
              <dt className="text-[11px] font-bold tracking-widest text-neon uppercase">Plataformas</dt>
              <dd className="mt-1 font-bold">{game.platforms.join(' · ')}</dd>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 px-3 py-3">
              <dt className="text-[11px] font-bold tracking-widest text-amber uppercase">Año</dt>
              <dd className="mt-1 font-bold">{game.year}</dd>
            </div>
          </dl>
        </div>
      </div>
      <section className="border-t border-white/10 px-4 pt-5 pb-4 sm:px-6 sm:pb-6">
        <h3 className="font-display text-xl tracking-wide">Capturas</h3>
        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {game.screenshots.map((src, index) => (
            <li key={src} className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
              <img
                src={src}
                alt={`Captura ${index + 1} de ${game.name}`}
                className="aspect-video w-full object-cover"
              />
            </li>
          ))}
        </ul>
      </section>
      <section className="border-t border-white/10 px-4 pt-5 pb-4 sm:px-6 sm:pb-6">
        <h3 className="font-display text-xl tracking-wide">Mecánicas</h3>
        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {game.mechanics.map((item) => (
            <li key={item.image} className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
              <img
                src={item.image}
                alt={item.label}
                className="aspect-video w-full object-cover"
              />
              <p className="px-3 py-2 text-sm font-bold">{item.label}</p>
            </li>
          ))}
        </ul>
      </section>
    </article>
  )
}

function Shelf({ title, accent, count, empty, children }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-panel/80 p-4 shadow-[0_0_40px_rgb(0_0_0/0.35)] backdrop-blur">
      <header className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className={`font-display text-xl tracking-wide ${accent}`}>{title}</h2>
        <span className="text-sm text-white/50">{count}</span>
      </header>
      {count === 0 ? <p className="text-sm text-white/45">{empty}</p> : <ul className="space-y-3">{children}</ul>}
    </section>
  )
}

function SoundButton() {
  const audioRef = useRef(null)
  const wantSound = useRef(true)
  const started = useRef(false)
  const [on, setOn] = useState(true)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    let cancelled = false
    let removeGesture = () => {}

    const tryPlay = () => {
      if (cancelled || !wantSound.current) return Promise.resolve(false)
      return audio
        .play()
        .then(() => {
          if (cancelled || !wantSound.current) {
            audio.pause()
            started.current = false
            return false
          }
          started.current = true
          return true
        })
        .catch(() => {
          started.current = false
          return false
        })
    }

    const armGesture = () => {
      const onGesture = (event) => {
        const target = event.target
        if (target instanceof Element && target.closest('[data-sound-toggle]')) return
        tryPlay().then((playing) => {
          if (!playing) return
          window.removeEventListener('pointerdown', onGesture, true)
          window.removeEventListener('keydown', onGesture, true)
        })
      }
      window.addEventListener('pointerdown', onGesture, true)
      window.addEventListener('keydown', onGesture, true)
      return () => {
        window.removeEventListener('pointerdown', onGesture, true)
        window.removeEventListener('keydown', onGesture, true)
      }
    }

    tryPlay().then((playing) => {
      if (cancelled || playing) return
      removeGesture = armGesture()
    })

    return () => {
      cancelled = true
      removeGesture()
    }
  }, [])

  function toggle() {
    const audio = audioRef.current
    if (!audio) return
    if (started.current) {
      wantSound.current = false
      started.current = false
      setOn(false)
      audio.pause()
      return
    }
    wantSound.current = true
    setOn(true)
    audio
      .play()
      .then(() => {
        if (!wantSound.current) {
          audio.pause()
          started.current = false
          return
        }
        started.current = true
      })
      .catch(() => {
        started.current = false
      })
  }

  return (
    <div className="shrink-0">
      <audio ref={audioRef} className="hidden" src="/30dias.m4a" loop preload="auto" />
      <button
        type="button"
        data-sound-toggle
        onClick={toggle}
        aria-pressed={on}
        aria-label={on ? 'Apagar sonido' : 'Encender sonido'}
        className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold tracking-wide uppercase hover:bg-white/20"
      >
        {on ? 'Sonido on' : 'Sonido off'}
      </button>
    </div>
  )
}

export default function App() {
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [toPlay, setToPlay] = useState(() => loadShelves().toPlay)
  const [played, setPlayed] = useState(() => loadShelves().played)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ toPlay, played }))
  }, [toPlay, played])

  const ratingById = useMemo(
    () => new Map(played.map((entry) => [entry.id, entry.rating])),
    [played],
  )
  const toPlayIds = useMemo(() => new Set(toPlay), [toPlay])

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return games
    return games.filter((game) => game.name.toLowerCase().includes(needle))
  }, [query])

  const selectedGame = games.find((game) => game.id === selectedId) ?? null

  const toPlayGames = toPlay
    .map((id) => games.find((game) => game.id === id))
    .filter(Boolean)
  const playedGames = played
    .map((entry) => games.find((game) => game.id === entry.id))
    .filter(Boolean)

  function addToPlay(id) {
    setPlayed((current) => current.filter((entry) => entry.id !== id))
    setToPlay((current) => (current.includes(id) ? current : [...current, id]))
  }

  function markPlayed(id) {
    setToPlay((current) => current.filter((entry) => entry !== id))
    setPlayed((current) =>
      current.some((entry) => entry.id === id) ? current : [...current, { id, rating: null }],
    )
  }

  function setRating(id, score) {
    setPlayed((current) =>
      current.map((entry) =>
        entry.id === id ? { ...entry, rating: entry.rating === score ? null : score } : entry,
      ),
    )
  }

  function removeGame(id) {
    setToPlay((current) => current.filter((entry) => entry !== id))
    setPlayed((current) => current.filter((entry) => entry.id !== id))
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-8">
        <p className="mb-2 text-xs font-bold tracking-[0.35em] text-neon uppercase">Estantería</p>
        <div className="flex items-center justify-between gap-3">
          <h1 className="leading-none">
            <Logo className="h-8 sm:h-9" />
          </h1>
          <SoundButton />
        </div>
        <p className="mt-2 max-w-xl text-white/70">
          Tu lista de juegos, sin cuentas. Buscá, guardá lo que querés jugar y marcá lo que ya terminaste.
        </p>
        <label className="mt-6 block">
          <span className="sr-only">Buscar por nombre</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre"
            className="w-full rounded-2xl border border-neon/30 bg-black/40 px-4 py-3 text-lg outline-none transition placeholder:text-white/35 focus:border-neon focus:shadow-[0_0_24px_rgb(61_255_232/0.25)]"
          />
        </label>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section>
          {selectedGame ? (
            <GameDetail game={selectedGame} onBack={() => setSelectedId(null)} />
          ) : (
            <>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-display text-2xl tracking-wide">Catálogo</h2>
            <p className="text-sm text-white/50">
              {visible.length} {visible.length === 1 ? 'juego' : 'juegos'}
            </p>
          </div>
          {visible.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-white/15 px-4 py-10 text-center text-white/55">
              Ningún juego coincide con “{query.trim()}”.
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {visible.map((game) => {
                const onToPlay = toPlayIds.has(game.id)
                const onPlayed = ratingById.has(game.id)
                return (
                  <li key={game.id}>
                    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-panel/90 transition duration-200 hover:-translate-y-1 hover:border-neon/60 hover:shadow-[0_12px_40px_rgb(61_255_232/0.18)]">
                      <button
                        type="button"
                        onClick={() => setSelectedId(game.id)}
                        className="w-full text-left"
                        aria-label={`Ver ficha de ${game.name}`}
                      >
                        <Cover game={game} className="aspect-[2/3] w-full" />
                        <div className="px-3 pt-3">
                          <h3 className="font-bold leading-tight group-hover:text-neon">{game.name}</h3>
                          <p className="mt-1 text-xs tracking-wide text-white/55 uppercase">
                            {game.genre} · {game.platform}
                          </p>
                        </div>
                      </button>
                      <div className="flex flex-1 flex-col gap-3 p-3">
                        {onPlayed ? (
                          <Stars value={ratingById.get(game.id)} onChange={(score) => setRating(game.id, score)} />
                        ) : null}
                        <div className="mt-auto flex flex-wrap gap-2">
                          {onPlayed ? (
                            <button
                              type="button"
                              onClick={() => addToPlay(game.id)}
                              className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold tracking-wide uppercase hover:bg-white/20"
                            >
                              Por jugar
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => addToPlay(game.id)}
                              disabled={onToPlay}
                              className="rounded-full bg-neon px-3 py-1.5 text-xs font-bold tracking-wide text-ink uppercase disabled:cursor-default disabled:bg-white/10 disabled:text-white/45"
                            >
                              {onToPlay ? 'En por jugar' : 'Por jugar'}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => markPlayed(game.id)}
                            disabled={onPlayed}
                            className="rounded-full bg-magenta px-3 py-1.5 text-xs font-bold tracking-wide text-white uppercase disabled:cursor-default disabled:bg-white/10 disabled:text-white/45"
                          >
                            {onPlayed ? 'Jugado' : 'Ya lo jugué'}
                          </button>
                          {onToPlay || onPlayed ? (
                            <button
                              type="button"
                              onClick={() => removeGame(game.id)}
                              className="rounded-full px-3 py-1.5 text-xs font-bold tracking-wide text-white/55 uppercase hover:text-white"
                            >
                              Quitar
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  </li>
                )
              })}
            </ul>
          )}
            </>
          )}
        </section>

        <aside className="space-y-4 lg:sticky lg:top-6">
          <Shelf
            title="Por jugar"
            accent="text-neon"
            count={toPlayGames.length}
            empty="Todavía no guardaste nada. Sumá un juego del catálogo."
          >
            {toPlayGames.map((game) => (
              <li key={game.id} className="flex gap-3 rounded-2xl border border-white/10 bg-black/25 p-2">
                <Cover game={game} className="h-20 w-14 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{game.name}</p>
                  <p className="text-xs text-white/50 uppercase">
                    {game.genre} · {game.platform}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => markPlayed(game.id)}
                      className="rounded-full bg-magenta px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase"
                    >
                      Ya lo jugué
                    </button>
                    <button
                      type="button"
                      onClick={() => removeGame(game.id)}
                      className="rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide text-white/55 uppercase hover:text-white"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </Shelf>

          <Shelf
            title="Jugados"
            accent="text-magenta"
            count={playedGames.length}
            empty="Cuando termines uno, marcalo acá. La nota es opcional."
          >
            {playedGames.map((game) => (
              <li key={game.id} className="flex gap-3 rounded-2xl border border-white/10 bg-black/25 p-2">
                <Cover game={game} className="h-20 w-14 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{game.name}</p>
                  <p className="text-xs text-white/50 uppercase">
                    {game.genre} · {game.platform}
                  </p>
                  <div className="mt-1">
                    <Stars value={ratingById.get(game.id)} onChange={(score) => setRating(game.id, score)} />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeGame(game.id)}
                    className="mt-1 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide text-white/55 uppercase hover:text-white"
                  >
                    Quitar
                  </button>
                </div>
              </li>
            ))}
          </Shelf>
        </aside>
      </div>
    </div>
  )
}
