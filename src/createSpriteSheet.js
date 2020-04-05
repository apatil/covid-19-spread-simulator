import {
  BALL_RADIUS,
  COLORS,
  STATES,
  BADGE_RADIUS,
  INTERVENTION_BADGES,
  BADGE_COLORS
} from './options.js'
import { handwashPct, maskPct, n95Pct } from './dom.js'

// add example state for dom
const alteredStates = Object.assign({}, STATES, { example: 'example' })
const alteredColors = Object.assign({}, COLORS, { example: '#ccc' })

function getCombinations (array) {
  var result = []
  var f = function (prefix = [], array) {
    for (var i = 0; i < array.length; i++) {
      result.push([...prefix, array[i]])
      f([...prefix, array[i]], array.slice(i + 1))
    }
  }
  f('', array)
  return result
}

// assume 2 radius for badges
const spriteSize = (BALL_RADIUS + BADGE_RADIUS) * 2
const angleStep = (Math.PI * 2) / INTERVENTION_BADGES.length
const badgePositions = INTERVENTION_BADGES.map((n, i) => {
  const angle = i * angleStep - Math.PI
  const ax = BALL_RADIUS * Math.cos(angle)
  const ay = BALL_RADIUS * Math.sin(angle)
  return [ax, ay]
})

// generate all possible intervention combos
const combos = getCombinations(INTERVENTION_BADGES)
// add blank to start
combos.unshift([])

const createSpriteSheet = sketch => {
  const c = document.createElement('canvas')
  c.width = combos.length * spriteSize
  c.height = Object.keys(alteredStates).length * spriteSize
  const cx = c.getContext('2d')

  // this creates the lookup and draws on the spritesheet
  //
  const lookup = {}
  // different circle each row
  for (let r = 0; r < Object.keys(alteredStates).length; r++) {
    // different intervention combo each column
    for (let c = 0; c < combos.length; c++) {
      const state = Object.keys(alteredStates)[r]
      const combo = combos[c]
      const rad = BALL_RADIUS
      const y = r * spriteSize
      const x = c * spriteSize
      const offset = BALL_RADIUS + BADGE_RADIUS

      // base circle
      cx.fillStyle = alteredColors[state]
      cx.beginPath()
      cx.arc(x + offset, y + offset, rad, 0, Math.PI * 2)
      cx.fill()

      // draw appropriate badges
      for (let i = 0; i < combo.length; i++) {
        const index = INTERVENTION_BADGES.indexOf(combo[i])
        const [ax, ay] = badgePositions[index]
        const color = BADGE_COLORS[index]
        cx.fillStyle = color
        cx.beginPath()
        cx.arc(x + offset + ax, y + offset + ay, BADGE_RADIUS, 0, Math.PI * 2)
        cx.fill()
      }

      let name = state
      if (combo.length > 0) {
        name += '-' + combo.join('-')
      }
      lookup[name] = [x, y, spriteSize, spriteSize]
    }
  }
  // append for debug purposes
  // document.body.appendChild(c)

  // show examples in dom
  function createBadgeCanvas () {
    const temp = document.createElement('canvas')
    temp.width = (BALL_RADIUS + BADGE_RADIUS) * 2
    temp.height = (BALL_RADIUS + BADGE_RADIUS) * 2
    return temp
  }
  const toLabel = ['handwash', 'mask', 'n95']
  const $inputs = [handwashPct, maskPct, n95Pct]
  for (let i = 0; i < toLabel.length; i++) {
    const $label = $inputs[i].parentNode
    const example = createBadgeCanvas()
    example.getContext('2d').drawImage(c, ...lookup['example-' + toLabel[i]], 0, 0, example.width, example.height)
    example.style.marginRight = '4px'
    $label.prepend(example)
  }

  sketch.sprite = c
  sketch.sprite_lookup = lookup
}
export default createSpriteSheet
