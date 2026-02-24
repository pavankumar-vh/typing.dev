import { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useConfig, LANGUAGES, DURATIONS } from '../context/ConfigContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const FONT     = 'JetBrains Mono, monospace'
const API_BASE = import.meta.env.VITE_API_URL || ''

const AVATAR_COLORS = ['#00FF41','#39FF14','#00FFCC','#FFD700','#FF6B6B','#C77DFF','#48CAE4','#F8961E']

/* ─── tiny helpers ─────────────────────────────────────── */
function fmt(n, decimals = 0) {
  if (n == null) return '—'
  return decimals ? Number(n).toFixed(decimals) : n
}
function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

/* ─── heatmap colours ───────────────────────────────────── */
function cellBg(n) {
  if (!n)      return 'rgba(0,40,0,0.5)'
  if (n === 1) return 'rgba(0,115,0,0.65)'
  if (n <= 3)  return 'rgba(0,175,0,0.75)'
  if (n <= 6)  return 'rgba(0,225,0,0.85)'
  return '#00FF41'
}
function cellGlow(n) {
  if (n >= 7) return '0 0 5px rgba(0,255,65,0.6)'
  if (n >= 4) return '0 0 3px rgba(0,220,0,0.4)'
  return 'none'
}

/* ─── Avatar ────────────────────────────────────────────── */
function AvatarCircle({ name, color, size = 64 }) {
  const ini = name
    ? name.trim().split(/\s+/).map(w => w[0].toUpperCase()).slice(0,2).join('')
    : '?'
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%', flexShrink:0,
      display:'flex', alignItems:'center', justifyContent:'center',
      background:'rgba(0,6,0,0.97)', border:`2.5px solid ${color}`,
      color, fontSize:size*0.34, fontWeight:700, fontFamily:FONT,
      boxShadow:`0 0 20px ${color}50, 0 0 40px ${color}18`,
      userSelect:'none', letterSpacing:'0.04em',
    }}>{ini}</div>
  )
}

/* ─── StatStrip ─────────────────────────────────────────── */
function StatStrip({ items }) {
  return (
    <div style={{
      display:'flex', borderRadius:12, overflow:'hidden',
      border:'1px solid rgba(0,90,0,0.22)', background:'rgba(0,5,0,0.6)',
    }}>
      {items.map((it,i) => (
        <div key={it.label} style={{
          flex:1, padding:'13px 12px', textAlign:'center',
          borderRight: i<items.length-1 ? '1px solid rgba(0,70,0,0.25)' : 'none',
        }}>
          <div style={{ fontFamily:FONT, fontSize:20, fontWeight:700, lineHeight:1, color:'#00FF41', textShadow:'0 0 14px rgba(0,255,65,0.55)' }}>
            {it.value ?? '—'}
          </div>
          <div style={{ fontFamily:FONT, fontSize:8, marginTop:5, color:'rgba(0,204,53,0.3)', letterSpacing:'0.14em', textTransform:'uppercase' }}>
            {it.label}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── SkeletonBlock ─────────────────────────────────────── */
function Sk({ w='100%', h=14, r=4 }) {
  return <div className="lb-skeleton" style={{ width:w, height:h, borderRadius:r, flexShrink:0 }} />
}

/* ─── BigStatGrid (monkeytype-style) ────────────────────── */
function BigStatGrid({ items }) {
  const cols = 3
  return (
    <div style={{
      display:'grid', gridTemplateColumns:`repeat(${cols},1fr)`,
      border:'1px solid rgba(0,88,0,0.18)', borderRadius:12, overflow:'hidden',
    }}>
      {items.map((it,i) => (
        <div key={i} style={{
          padding:'16px 18px', background:'rgba(0,5,0,0.5)',
          borderRight: i%cols!==cols-1 ? '1px solid rgba(0,60,0,0.2)' : 'none',
          borderBottom: i<items.length-cols ? '1px solid rgba(0,60,0,0.2)' : 'none',
        }}>
          <div style={{ fontFamily:FONT, fontSize:8, letterSpacing:'0.14em', textTransform:'uppercase', color:'rgba(0,204,53,0.28)', marginBottom:7 }}>
            {it.label}
          </div>
          <div style={{ fontFamily:FONT, fontSize:26, fontWeight:700, lineHeight:1, color:'#00FF41', textShadow:'0 0 12px rgba(0,255,65,0.4)' }}>
            {fmt(it.value)}
          </div>
          {it.sub && (
            <div style={{ fontFamily:FONT, fontSize:8, marginTop:4, color:'rgba(0,204,53,0.2)', letterSpacing:'0.09em' }}>{it.sub}</div>
          )}
        </div>
      ))}
    </div>
  )
}

/* ─── DurationCard (monkeytype time-mode cards) ─────────── */
function DurationCards({ sessions }) {
  const durations = [15, 30, 60, 90]
  const stats = useMemo(() => {
    return durations.map(dur => {
      const s = sessions.filter(x => Number(x.duration) === dur)
      if (!s.length) return { dur, count: 0, best: null, avg: null, avgAcc: null }
      const sorted = [...s].sort((a,b) => b.wpm - a.wpm)
      const best = sorted[0].wpm
      const avg  = Math.round(s.reduce((a,x) => a + x.wpm, 0) / s.length)
      const avgAcc = Math.round(s.reduce((a,x) => a + x.accuracy, 0) / s.length)
      return { dur, count: s.length, best, avg, avgAcc }
    })
  }, [sessions])

  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
      {stats.map(s => (
        <div key={s.dur} style={{
          padding:'14px 12px', borderRadius:10,
          border: s.count > 0 ? '1px solid rgba(0,88,0,0.3)' : '1px solid rgba(0,50,0,0.2)',
          background: s.count > 0 ? 'rgba(0,8,0,0.7)' : 'rgba(0,5,0,0.4)',
          textAlign:'center',
        }}>
          <div style={{ fontFamily:FONT, fontSize:9, letterSpacing:'0.15em', color:'rgba(0,204,53,0.28)', textTransform:'uppercase', marginBottom:8 }}>
            {s.dur}s
          </div>
          {s.count > 0 ? (
            <>
              <div style={{ fontFamily:FONT, fontSize:28, fontWeight:700, lineHeight:1, color:'#00FF41', textShadow:'0 0 14px rgba(0,255,65,0.5)' }}>
                {s.best}
              </div>
              <div style={{ fontFamily:FONT, fontSize:9, color:'rgba(0,204,53,0.35)', marginTop:5 }}>
                {s.avgAcc}%
              </div>
              <div style={{ fontFamily:FONT, fontSize:8, color:'rgba(0,204,53,0.2)', marginTop:2, letterSpacing:'0.08em' }}>
                {s.count} test{s.count!==1?'s':''}
              </div>
            </>
          ) : (
            <div style={{ fontFamily:FONT, fontSize:12, color:'rgba(0,204,53,0.15)', marginTop:4 }}>—</div>
          )}
        </div>
      ))}
    </div>
  )
}

/* ─── LangRow ───────────────────────────────────────────── */
function LangRow({ lang, topWpm, avgWpm, avgAccuracy, totalSessions, maxWpm }) {
  const pct = maxWpm > 0 ? Math.round((topWpm / maxWpm) * 100) : 0
  return (
    <div style={{
      display:'grid', gridTemplateColumns:'110px 1fr 60px 60px 52px',
      alignItems:'center', gap:12, padding:'10px 0',
      borderBottom:'1px solid rgba(0,50,0,0.2)',
    }}>
      <div style={{ fontFamily:FONT, fontSize:11, color:'rgba(0,204,53,0.7)', letterSpacing:'0.06em' }}>{lang}</div>
      <div style={{ height:4, borderRadius:2, background:'rgba(0,40,0,0.5)', overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pct}%`, background:'#00FF41', boxShadow:'0 0 6px rgba(0,255,65,0.4)', borderRadius:2 }} />
      </div>
      <div style={{ fontFamily:FONT, fontSize:13, fontWeight:700, color:'#00FF41', textAlign:'right' }}>{topWpm}</div>
      <div style={{ fontFamily:FONT, fontSize:11, color:'rgba(0,204,53,0.45)', textAlign:'right' }}>{avgWpm}</div>
      <div style={{ fontFamily:FONT, fontSize:11, color:'rgba(0,204,53,0.35)', textAlign:'right' }}>{avgAccuracy}%</div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   ActivityHeatmap — fixed layout, correct pixel math
═══════════════════════════════════════════════════════════ */
const CELL = 10   // cell px
const GAP  = 2    // gap px
const STRIDE = CELL + GAP  // 12px per column/row
const DAY_LABEL_W = 18     // day label col width (incl margin)

function buildGrid(today, countMap, weeks) {
  const todayKey = dateKey(today)
  const dow = (today.getDay() + 6) % 7       // 0=Mon — day-of-week of today
  const startDate = new Date(today)
  startDate.setHours(0, 0, 0, 0)
  startDate.setDate(today.getDate() - dow - (weeks - 1) * 7)

  const cols = []
  for (let w = 0; w < weeks; w++) {
    const col = []
    for (let d = 0; d < 7; d++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + w * 7 + d)
      const key = dateKey(date)
      const isFuture = date > today
      col.push({ date, key, isToday: key === todayKey, count: isFuture ? -1 : (countMap[key] || 0) })
    }
    cols.push(col)
  }
  return cols
}

function ActivityHeatmap({ sessions, loading }) {
  const [weeks, setWeeks] = useState(52)
  const [tooltip, setTooltip] = useState(null)
  const containerRef = useRef(null)

  const today = useMemo(() => {
    const d = new Date(); d.setHours(23,59,59,999); return d
  }, [])

  const countMap = useMemo(() => {
    const m = {}
    sessions.forEach(s => {
      if (!s.createdAt) return
      const k = dateKey(new Date(s.createdAt))
      m[k] = (m[k] || 0) + 1
    })
    return m
  }, [sessions])

  const grid = useMemo(() => buildGrid(today, countMap, weeks), [today, countMap, weeks])

  // compute derived stats
  const activeDays = useMemo(() => grid.flatMap(c=>c).filter(c=>c.count>0).length, [grid])
  const streakDays = useMemo(() => {
    let s = 0
    const d = new Date(today)
    // start from today
    while (true) {
      const k = dateKey(d)
      if (!countMap[k]) {
        // try yesterday in case today has no session yet
        if (s === 0) { d.setDate(d.getDate()-1); const k2 = dateKey(d); if (!countMap[k2]) break; s++; d.setDate(d.getDate()-1); continue }
        break
      }
      s++
      d.setDate(d.getDate()-1)
    }
    return s
  }, [today, countMap])
  const longestStreak = useMemo(() => {
    let best=0, cur=0
    grid.flatMap(c=>c).filter(c=>c.count>=0).forEach(cell => {
      if (cell.count>0) { cur++; best=Math.max(best,cur) } else cur=0
    })
    return best
  }, [grid])

  // month labels: one label per month-start column
  const monthLabels = useMemo(() => {
    const out = []; let last = -1
    grid.forEach((col, wi) => {
      const m = col[0].date.getMonth()
      if (m !== last) { out.push({ wi, text: col[0].date.toLocaleString('default',{month:'short'}) }); last = m }
    })
    return out
  }, [grid])

  // total pixel width of cell area
  const cellAreaW = weeks * STRIDE - GAP  // no trailing gap
  const totalW = DAY_LABEL_W + cellAreaW  // day labels + cells

  const RANGE_OPTS = [
    { label: 'last 6 months', weeks: 26 },
    { label: 'last year',     weeks: 52 },
  ]

  return (
    <div style={{ borderRadius:16, border:'1px solid rgba(0,88,0,0.18)', background:'rgba(0,5,0,0.5)', padding:'20px 22px' }}>

      {/* ── header row ── */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14, flexWrap:'wrap', gap:8 }}>
        <div>
          <div style={{ fontFamily:FONT, fontSize:9, letterSpacing:'0.2em', textTransform:'uppercase', color:'rgba(0,204,53,0.3)', marginBottom:10 }}>activity</div>
          <div style={{ display:'flex', gap:4 }}>
            {RANGE_OPTS.map(o => (
              <button key={o.weeks} onClick={() => setWeeks(o.weeks)} style={{
                fontFamily:FONT, fontSize:8, letterSpacing:'0.1em', padding:'4px 10px',
                cursor:'pointer', borderRadius:4,
                border: weeks===o.weeks ? '1px solid rgba(0,255,65,0.4)' : '1px solid rgba(0,60,0,0.25)',
                background: weeks===o.weeks ? 'rgba(0,255,65,0.08)' : 'transparent',
                color: weeks===o.weeks ? '#00FF41' : 'rgba(0,204,53,0.35)',
                transition:'all 0.12s',
              }}>{o.label}</button>
            ))}
          </div>
        </div>
        <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
          {[
            { label:'total tests',    value: sessions.length },
            { label:'active days',    value: activeDays },
            { label:'current streak', value: streakDays ? `${streakDays}d` : '—' },
            { label:'best streak',    value: longestStreak ? `${longestStreak}d` : '—' },
          ].map(s => (
            <div key={s.label} style={{ textAlign:'right' }}>
              <div style={{ fontFamily:FONT, fontSize:14, fontWeight:700, color:'#00FF41', textShadow:'0 0 10px rgba(0,255,65,0.45)', lineHeight:1 }}>
                {s.value}
              </div>
              <div style={{ fontFamily:FONT, fontSize:7, color:'rgba(0,204,53,0.26)', letterSpacing:'0.12em', textTransform:'uppercase', marginTop:3 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── grid ── */}
      {loading ? (
        <div className="lb-skeleton" style={{ width:'100%', height:7*STRIDE-GAP+34, borderRadius:6 }} />
      ) : (
        <div ref={containerRef} style={{ overflowX:'auto', overflowY:'visible' }}>
          {/* exact-width wrapper so month labels align with cell columns */}
          <div style={{ width: totalW + 'px', position:'relative' }}>

            {/* month labels — positioned relative to cell area start (DAY_LABEL_W) */}
            <div style={{ position:'relative', height:14, marginBottom:3 }}>
              {monthLabels.map(({ wi, text }) => (
                <span key={text+wi} style={{
                  position:'absolute',
                  left: DAY_LABEL_W + wi * STRIDE,
                  fontFamily:FONT, fontSize:8, lineHeight:'14px',
                  color:'rgba(0,204,53,0.3)', textTransform:'uppercase', letterSpacing:'0.06em',
                  whiteSpace:'nowrap',
                }}>{text}</span>
              ))}
            </div>

            {/* day labels + cell columns */}
            <div style={{ display:'flex', gap:0 }}>
              {/* Mon Wed Fri labels */}
              <div style={{ display:'flex', flexDirection:'column', gap:GAP, width: DAY_LABEL_W, flexShrink:0 }}>
                {['M','','W','','F','',''].map((d,i) => (
                  <div key={i} style={{ height:CELL, display:'flex', alignItems:'center', justifyContent:'flex-end', paddingRight:4, fontFamily:FONT, fontSize:7, color:'rgba(0,204,53,0.28)', letterSpacing:'0.04em' }}>
                    {d}
                  </div>
                ))}
              </div>

              {/* week columns */}
              <div style={{ display:'flex', gap:GAP }}>
                {grid.map((col, wi) => (
                  <div key={wi} style={{ display:'flex', flexDirection:'column', gap:GAP }}>
                    {col.map((cell, di) => {
                      const future = cell.count === -1
                      return (
                        <div key={di}
                          onMouseEnter={e => {
                            if (future) return
                            const lbl = cell.date.toLocaleDateString('en-US',{ month:'short', day:'numeric', year:'numeric' })
                            setTooltip({
                              x: e.clientX, y: e.clientY,
                              text: cell.isToday
                                ? `today · ${cell.count > 0 ? cell.count + ` test${cell.count>1?'s':''}` : 'no tests'}`
                                : cell.count > 0 ? `${cell.count} test${cell.count>1?'s':''} · ${lbl}` : `no tests · ${lbl}`,
                            })
                          }}
                          onMouseLeave={() => setTooltip(null)}
                          style={{
                            width:CELL, height:CELL, borderRadius:2, flexShrink:0,
                            background: future ? 'rgba(0,18,0,0.2)' : cellBg(cell.count),
                            boxShadow: cell.isToday
                              ? `0 0 0 1.5px #00FF41, 0 0 6px rgba(0,255,65,0.5)`
                              : future ? 'none' : cellGlow(cell.count),
                            outline: 'none',
                          }}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* legend */}
            <div style={{ display:'flex', alignItems:'center', gap:3, marginTop:6, justifyContent:'flex-end' }}>
              <span style={{ fontFamily:FONT, fontSize:7, color:'rgba(0,204,53,0.26)', marginRight:3 }}>less</span>
              {[0,1,2,4,7].map(n => (
                <div key={n} style={{ width:CELL, height:CELL, borderRadius:2, background:cellBg(n), boxShadow:cellGlow(n) }} />
              ))}
              <span style={{ fontFamily:FONT, fontSize:7, color:'rgba(0,204,53,0.26)', marginLeft:3 }}>more</span>
            </div>
          </div>
        </div>
      )}

      {/* fixed tooltip */}
      {tooltip && (
        <div style={{
          position:'fixed', top:tooltip.y-38, left:tooltip.x, transform:'translateX(-50%)',
          background:'rgba(0,10,0,0.97)', border:'1px solid rgba(0,100,0,0.4)',
          borderRadius:5, padding:'5px 10px', pointerEvents:'none', zIndex:9999,
          fontFamily:FONT, fontSize:10, color:'#00FF41', whiteSpace:'nowrap',
          boxShadow:'0 0 14px rgba(0,255,65,0.25)',
        }}>{tooltip.text}</div>
      )}
    </div>
  )
}

/* ─── HistoryTable ──────────────────────────────────────── */
function HistoryTable({ sessions, loading }) {
  const [shown, setShown] = useState(10)
  const visible = sessions.slice(0, shown)

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      {[...Array(5)].map((_,i) => <Sk key={i} h={34} r={4} />)}
    </div>
  )
  if (!sessions.length) return (
    <div style={{ fontFamily:FONT, fontSize:11, color:'rgba(0,204,53,0.25)', padding:'16px 0' }}>no sessions yet</div>
  )

  return (
    <>
      {/* header */}
      <div style={{
        display:'grid', gridTemplateColumns:'56px 54px 54px 1fr 54px 80px',
        fontFamily:FONT, fontSize:8, letterSpacing:'0.14em', textTransform:'uppercase',
        color:'rgba(0,204,53,0.2)', paddingBottom:8, borderBottom:'1px solid rgba(0,60,0,0.2)',
      }}>
        <span>wpm</span><span>raw</span><span>acc</span><span>language</span><span>dur</span><span style={{textAlign:'right'}}>date</span>
      </div>
      {visible.map((s, i) => (
        <div key={s._id ?? i} style={{
          display:'grid', gridTemplateColumns:'56px 54px 54px 1fr 54px 80px',
          padding:'9px 0', fontFamily:FONT, fontSize:12, alignItems:'center',
          borderBottom: i < visible.length-1 ? '1px solid rgba(0,45,0,0.18)' : 'none',
        }}>
          <span style={{ color:'#00FF41', fontWeight:700 }}>{s.wpm}</span>
          <span style={{ color:'rgba(0,204,53,0.5)' }}>{s.rawWpm ?? '—'}</span>
          <span style={{ color:'rgba(0,204,53,0.55)' }}>{s.accuracy}%</span>
          <span style={{ color:'rgba(0,204,53,0.4)' }}>{s.language}</span>
          <span style={{ color:'rgba(0,204,53,0.35)' }}>{s.duration}s</span>
          <span style={{ color:'rgba(0,204,53,0.22)', fontSize:9, textAlign:'right' }}>
            {new Date(s.createdAt).toLocaleDateString('en-US',{ month:'short', day:'numeric' })}&nbsp;
            {new Date(s.createdAt).toLocaleTimeString('en-US',{ hour:'2-digit', minute:'2-digit' })}
          </span>
        </div>
      ))}
      {shown < sessions.length && (
        <button onClick={() => setShown(v => v + 10)} style={{
          display:'block', width:'100%', marginTop:12, padding:'9px 0',
          fontFamily:FONT, fontSize:10, letterSpacing:'0.14em', cursor:'pointer',
          border:'1px solid rgba(0,80,0,0.25)', borderRadius:7,
          background:'rgba(0,5,0,0.4)', color:'rgba(0,204,53,0.4)',
          transition:'all 0.15s',
        }}>
          load more ({sessions.length - shown} remaining)
        </button>
      )}
    </>
  )
}

/* ═══════════════════════════════════════════════════════════
   Main Profile component
═══════════════════════════════════════════════════════════ */
export default function Profile() {
  const { language, setLanguage, duration, setDuration } = useConfig()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [logoutLoading, setLogoutLoading] = useState(false)
  const [stats,         setStats]         = useState(null)
  const [allSessions,   setAllSessions]   = useState([])
  const [loadingStats,  setLoadingStats]  = useState(true)

  const [name,     setName]     = useState(() => localStorage.getItem('profile_name')  || '')
  const [color,    setColor]    = useState(() => localStorage.getItem('profile_color') || '#00FF41')
  const [editName, setEditName] = useState('')
  const [editing,  setEditing]  = useState(false)
  const [saved,    setSaved]    = useState(false)

  useEffect(() => {
    setLoadingStats(true)
    const uid = user?.uid
    const uq  = uid ? `?userId=${uid}` : ''
    const uqs = uid ? `&userId=${uid}` : ''
    Promise.all([
      fetch(`${API_BASE}/api/sessions/stats${uq}`).then(r=>r.json()).catch(()=>null),
      fetch(`${API_BASE}/api/sessions?limit=2000&sort=newest${uqs}`).then(r=>r.json()).catch(()=>null),
    ]).then(([sRes, aRes]) => {
      if (sRes?.success)  setStats(sRes.data)
      if (aRes?.success)  setAllSessions(aRes.data ?? [])
    }).finally(() => setLoadingStats(false))
  }, [user])

  async function handleLogout() {
    setLogoutLoading(true)
    try { await logout(); navigate('/') } finally { setLogoutLoading(false) }
  }
  function startEdit()  { setEditName(name); setEditing(true); setSaved(false) }
  function saveProfile() {
    const t = editName.trim().slice(0,24)
    setName(t); localStorage.setItem('profile_name',t); localStorage.setItem('profile_color',color)
    setEditing(false); setSaved(true); setTimeout(()=>setSaved(false),2500)
  }
  function pickColor(c) { setColor(c); localStorage.setItem('profile_color',c) }

  const g      = stats?.global
  const byLang = stats?.byLanguage ?? []
  const maxWpm = byLang.length ? Math.max(...byLang.map(l=>l.topWpm)) : 1
  const bestL  = byLang.length ? byLang.reduce((a,b)=>a.topWpm>b.topWpm?a:b) : null
  const displayName = user?.displayName || name || 'anonymous'

  /* shared style tokens */
  const card = {
    borderRadius:16, border:'1px solid rgba(0,88,0,0.18)',
    background:'rgba(0,5,0,0.5)', padding:'20px 22px', marginBottom:14,
  }
  const SL = {  // section label
    fontFamily:FONT, fontSize:9, letterSpacing:'0.2em', textTransform:'uppercase',
    color:'rgba(0,204,53,0.28)', marginBottom:14,
  }
  const pill = (on) => ({
    fontFamily:FONT, fontSize:10, letterSpacing:'0.1em',
    padding:'6px 14px', cursor:'pointer', borderRadius:6,
    border: on ? '1px solid rgba(0,255,65,0.45)' : '1px solid rgba(0,80,0,0.28)',
    background: on ? 'rgba(0,255,65,0.07)' : 'transparent',
    color: on ? '#00FF41' : 'rgba(0,204,53,0.36)',
    textShadow: on ? '0 0 8px rgba(0,255,65,0.3)' : 'none',
    transition:'all 0.14s',
  })

  return (
    <div style={{ minHeight:'calc(100vh - 53px)', display:'flex', flexDirection:'column', alignItems:'center', padding:'52px 20px 96px', fontFamily:FONT }}>
      <div style={{ width:'100%', maxWidth:740 }}>

        {/* breadcrumb + title */}
        <div style={{ fontFamily:FONT, fontSize:9, letterSpacing:'0.3em', color:'rgba(0,204,53,0.28)', textTransform:'uppercase', marginBottom:6 }}>
          &gt;&nbsp;profile
        </div>
        <h1 style={{ fontFamily:FONT, fontSize:24, fontWeight:700, color:'#00FF41', textShadow:'0 0 20px rgba(0,255,65,0.5)', letterSpacing:'0.04em', marginBottom:24, lineHeight:1 }}>
          {displayName}
        </h1>

        {/* ══ HERO CARD ══════════════════════════════════════ */}
        <div style={card}>
          <div style={{ display:'flex', alignItems:'center', gap:18, marginBottom:18 }}>
            <AvatarCircle name={displayName} color={color} size={64} />
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:FONT, fontSize:16, fontWeight:700, color:'#00FF41', lineHeight:1, marginBottom:5 }}>
                {displayName}
              </div>
              {user && (
                <div style={{ fontFamily:FONT, fontSize:10, color:'rgba(0,204,53,0.3)', letterSpacing:'0.07em', marginBottom:2 }}>
                  {user.email}
                </div>
              )}
              {user?.metadata?.creationTime && (
                <div style={{ fontFamily:FONT, fontSize:8, color:'rgba(0,204,53,0.2)', letterSpacing:'0.06em' }}>
                  joined {new Date(user.metadata.creationTime).toLocaleDateString('en-US',{ month:'long', day:'numeric', year:'numeric' })}
                </div>
              )}
            </div>
            {user && (
              <button onClick={handleLogout} disabled={logoutLoading} style={{
                fontFamily:FONT, fontSize:9, letterSpacing:'0.12em', padding:'7px 14px',
                cursor:'pointer', borderRadius:6,
                border:'1px solid rgba(255,68,68,0.28)', background:'transparent',
                color:'rgba(255,88,88,0.65)', opacity:logoutLoading?0.4:1, transition:'all 0.14s', flexShrink:0,
              }}>
                {logoutLoading ? '...' : 'logout'}
              </button>
            )}
          </div>
          {loadingStats ? (
            <div style={{ display:'flex', gap:6 }}>
              {[1,2,3,4].map(i=><Sk key={i} w="25%" h={52} r={10} />)}
            </div>
          ) : (
            <StatStrip items={[
              { label:'tests taken',  value: fmt(g?.totalSessions) },
              { label:'best wpm',     value: fmt(g?.topWpm) },
              { label:'avg wpm',      value: fmt(g?.avgWpm) },
              { label:'avg accuracy', value: g?.avgAccuracy!=null ? `${g.avgAccuracy}%` : '—' },
            ]} />
          )}
        </div>

        {/* ══ ACTIVITY HEATMAP ═══════════════════════════════ */}
        <div style={{ marginBottom:14 }}>
          <ActivityHeatmap sessions={allSessions} loading={loadingStats} />
        </div>

        {/* ══ BY DURATION (monkeytype mode cards) ════════════ */}
        <div style={card}>
          <div style={SL}>best wpm by duration</div>
          {loadingStats ? (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
              {[...Array(4)].map((_,i)=><Sk key={i} h={90} r={8} />)}
            </div>
          ) : (
            <DurationCards sessions={allSessions} />
          )}
        </div>

        {/* ══ PERFORMANCE GRID ═══════════════════════════════ */}
        <div style={card}>
          <div style={SL}>performance</div>
          {loadingStats ? (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:1 }}>
              {[...Array(6)].map((_,i)=><Sk key={i} h={70} r={2} />)}
            </div>
          ) : g ? (
            <BigStatGrid items={[
              { label:'best wpm',       value: fmt(g.topWpm) },
              { label:'avg wpm',        value: fmt(g.avgWpm) },
              { label:'tests completed',value: fmt(g.totalSessions) },
              { label:'avg accuracy',   value: g.avgAccuracy!=null ? `${g.avgAccuracy}%` : '—' },
              { label:'top language',   value: bestL?.language ?? '—', sub: bestL ? `${bestL.topWpm} wpm peak` : undefined },
              { label:'languages used', value: byLang.length || '—' },
            ]} />
          ) : (
            <div style={{ fontFamily:FONT, fontSize:11, color:'rgba(0,204,53,0.24)', textAlign:'center', padding:'20px 0' }}>
              no sessions yet — finish a test first
            </div>
          )}
        </div>

        {/* ══ LANGUAGE BREAKDOWN ═════════════════════════════ */}
        {!loadingStats && byLang.length > 0 && (
          <div style={card}>
            <div style={SL}>by language</div>
            <div style={{
              display:'grid', gridTemplateColumns:'110px 1fr 60px 60px 52px',
              fontFamily:FONT, fontSize:8, letterSpacing:'0.13em', textTransform:'uppercase',
              color:'rgba(0,204,53,0.2)', paddingBottom:8, borderBottom:'1px solid rgba(0,55,0,0.2)',
              gap:12,
            }}>
              <span>language</span><span>best wpm</span><span style={{textAlign:'right'}}>peak</span>
              <span style={{textAlign:'right'}}>avg</span><span style={{textAlign:'right'}}>acc</span>
            </div>
            {[...byLang].sort((a,b)=>b.topWpm-a.topWpm).map(l => (
              <LangRow key={l.language}
                lang={l.language} topWpm={l.topWpm} avgWpm={l.avgWpm}
                avgAccuracy={l.avgAccuracy} totalSessions={l.totalSessions}
                maxWpm={maxWpm}
              />
            ))}
          </div>
        )}

        {/* ══ TEST HISTORY ═══════════════════════════════════ */}
        <div style={card}>
          <div style={SL}>test history</div>
          <HistoryTable sessions={allSessions} loading={loadingStats} />
        </div>

        {/* ══ IDENTITY ═══════════════════════════════════════ */}
        <div style={card}>
          <div style={SL}>identity</div>
          <div style={{ display:'flex', alignItems:'flex-start', gap:18 }}>
            <AvatarCircle name={name} color={color} size={56} />
            <div style={{ flex:1 }}>
              <AnimatePresence mode="wait">
                {!editing ? (
                  <motion.div key="view" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.13}}>
                    <div style={{ fontFamily:FONT, fontSize:17, fontWeight:700, color:'#00FF41', textShadow:'0 0 12px rgba(0,255,65,0.4)', marginBottom:4 }}>
                      {name || <span style={{opacity:0.28, fontWeight:400, fontSize:14}}>anonymous</span>}
                    </div>
                    <div style={{ fontFamily:FONT, fontSize:8, color:'rgba(0,204,53,0.25)', letterSpacing:'0.1em', marginBottom:12 }}>
                      {name ? 'display name' : 'no name set'}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <button onClick={startEdit} style={{
                        fontFamily:FONT, fontSize:10, letterSpacing:'0.14em',
                        padding:'7px 16px', cursor:'pointer', borderRadius:6,
                        border:'1px solid rgba(0,255,65,0.22)', background:'transparent',
                        color:'rgba(0,255,65,0.6)', transition:'all 0.14s',
                      }}>
                        {name ? 'edit profile' : 'set up profile'}
                      </button>
                      {saved && (
                        <span style={{ fontFamily:FONT, fontSize:10, color:'#00FF41', textShadow:'0 0 8px rgba(0,255,65,0.4)', opacity:0.8 }}>
                          saved ✓
                        </span>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="edit" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.13}}>
                    <div style={{ marginBottom:16 }}>
                      <div style={{ fontFamily:FONT, fontSize:8, letterSpacing:'0.14em', textTransform:'uppercase', color:'rgba(0,204,53,0.26)', marginBottom:8 }}>display name</div>
                      <input autoFocus value={editName}
                        onChange={e=>setEditName(e.target.value)}
                        onKeyDown={e=>{ if(e.key==='Enter') saveProfile(); if(e.key==='Escape') setEditing(false) }}
                        maxLength={24} placeholder="your name..."
                        style={{ width:'100%', background:'transparent', outline:'none', border:'none',
                          borderBottom:'1px solid rgba(0,255,65,0.32)', color:'#00FF41',
                          fontFamily:FONT, fontSize:16, padding:'4px 2px', caretColor:'#00FF41' }}
                      />
                      <div style={{ fontFamily:FONT, fontSize:8, color:'rgba(0,204,53,0.2)', marginTop:5, letterSpacing:'0.08em' }}>
                        enter to save · esc to cancel
                      </div>
                    </div>
                    <div style={{ marginBottom:16 }}>
                      <div style={{ fontFamily:FONT, fontSize:8, letterSpacing:'0.14em', textTransform:'uppercase', color:'rgba(0,204,53,0.26)', marginBottom:9 }}>avatar colour</div>
                      <div style={{ display:'flex', gap:9, flexWrap:'wrap' }}>
                        {AVATAR_COLORS.map(c => (
                          <button key={c} onClick={()=>pickColor(c)} style={{
                            width:24, height:24, borderRadius:'50%', background:c, cursor:'pointer',
                            border: color===c ? '2px solid #fff' : '2px solid transparent',
                            boxShadow: color===c ? `0 0 10px ${c}` : 'none', transition:'all 0.14s',
                          }} />
                        ))}
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:9 }}>
                      <button onClick={saveProfile} style={{
                        fontFamily:FONT, fontSize:10, letterSpacing:'0.14em', fontWeight:700,
                        padding:'8px 20px', cursor:'pointer', borderRadius:6, border:'none',
                        background:'#00FF41', color:'#000', boxShadow:'0 0 14px rgba(0,255,65,0.45)', transition:'all 0.14s',
                      }}>save</button>
                      <button onClick={()=>setEditing(false)} style={{
                        fontFamily:FONT, fontSize:10, letterSpacing:'0.14em',
                        padding:'8px 16px', cursor:'pointer', borderRadius:6,
                        border:'1px solid rgba(0,255,65,0.16)', background:'transparent',
                        color:'rgba(0,255,65,0.38)', transition:'all 0.14s',
                      }}>cancel</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ══ ACCOUNT ════════════════════════════════════════ */}
        <div style={card}>
          <div style={SL}>account</div>
          {user ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
              <div>
                <div style={{ fontFamily:FONT, fontSize:13, color:'#00FF41', marginBottom:3 }}>{user.displayName || 'no display name'}</div>
                <div style={{ fontFamily:FONT, fontSize:10, color:'rgba(0,204,53,0.3)', letterSpacing:'0.06em' }}>{user.email}</div>
              </div>
              <Link to="/my-stats" style={{ fontFamily:FONT, fontSize:10, letterSpacing:'0.12em', color:'rgba(0,204,53,0.38)', textDecoration:'none' }}>
                my stats →
              </Link>
            </div>
          ) : (
            <div style={{ display:'flex', alignItems:'center', gap:18 }}>
              <span style={{ fontFamily:FONT, fontSize:11, color:'rgba(0,204,53,0.25)' }}>not logged in</span>
              <Link to="/login" style={{ fontFamily:FONT, fontSize:11, color:'#00FF41', textDecoration:'none', textShadow:'0 0 8px rgba(0,255,65,0.4)' }}>&gt; login</Link>
              <Link to="/signup" style={{ fontFamily:FONT, fontSize:11, color:'rgba(0,204,53,0.38)', textDecoration:'none' }}>&gt; create account</Link>
            </div>
          )}
        </div>

        {/* ══ DEFAULT SETTINGS ═══════════════════════════════ */}
        <div style={card}>
          <div style={SL}>default settings</div>
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            <div>
              <div style={{ fontFamily:FONT, fontSize:8, letterSpacing:'0.14em', textTransform:'uppercase', color:'rgba(0,204,53,0.26)', marginBottom:9 }}>language</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {LANGUAGES.map(l => (
                  <button key={l} onClick={()=>{setLanguage(l);localStorage.setItem('pref_lang',l)}} style={pill(language===l)}>{l}</button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontFamily:FONT, fontSize:8, letterSpacing:'0.14em', textTransform:'uppercase', color:'rgba(0,204,53,0.26)', marginBottom:9 }}>duration</div>
              <div style={{ display:'flex', gap:6 }}>
                {DURATIONS.map(d => (
                  <button key={d} onClick={()=>{setDuration(d);localStorage.setItem('pref_dur',String(d))}} style={pill(duration===d)}>{d}s</button>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
