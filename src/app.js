import {
  BALL_RADIUS,
  CANVAS_SIZE,
  DESKTOP_CANVAS_SIZE,
  STARTING_BALLS,
  RUN,
  STATIC_PEOPLE_PERCENTATGE,
  STATES,
  DEFAULT_INTERVENTION_PARAMETERS
} from './options.js'

import {
  replayButton,
  runNowButton,
  // glovesPct,
  // gownPct,
  maskPct,
  handwashPct,
  n95Pct,
  baselineR0,
  testFrequency,
  testPct,
  emergencyLockdown,
  socialDistancePct
} from './dom.js'

import { Ball } from './Ball.js'

import {
  resetValues,
  updateCount
} from './results.js'

let balls = []
const matchMedia = window.matchMedia('(min-width: 800px)')

let isDesktop = matchMedia.matches

export const canvas = new window.p5(sketch => { // eslint-disable-line
  const startBalls = () => {
    let id = 0
    balls = []
    Object.keys(STARTING_BALLS).forEach(state => {
      Array.from({ length: STARTING_BALLS[state] }, () => {
        const hasMovement = RUN.filters.stayHome
          ? sketch.random(0, 100) < STATIC_PEOPLE_PERCENTATGE || state === STATES.infected
          : true

        balls[id] = new Ball({
          id,
          sketch,
          state,
          hasMovement,
          x: sketch.random(BALL_RADIUS, sketch.width - BALL_RADIUS),
          y: sketch.random(BALL_RADIUS, sketch.height - BALL_RADIUS)
        })
        id++
      })
    })
  }

  const createCanvas = () => {
    const { height, width } = isDesktop
      ? DESKTOP_CANVAS_SIZE
      : CANVAS_SIZE

    sketch.createCanvas(width, height)
  }

  sketch.setup = () => {
    createCanvas()
    startBalls()

    matchMedia.addListener(e => {
      isDesktop = e.matches
      createCanvas()
      startBalls()
      resetValues()
    })

    runNowButton.onclick = () => {
      startBalls()
      resetValues()
    }

    replayButton.onclick = () => {
      startBalls()
      resetValues()
    }

    baselineR0.onchange = (val) => {
      DEFAULT_INTERVENTION_PARAMETERS.baselineR0 = parseFloat(val.target.value)
    }
    baselineR0.setAttribute('value', DEFAULT_INTERVENTION_PARAMETERS.baselineR0.toString())

    // glovesPct.onchange = (val) => {
    //   DEFAULT_INTERVENTION_PARAMETERS.glovesPct = parseInt(val.target.value)
    // }
    // glovesPct.setAttribute('value', DEFAULT_INTERVENTION_PARAMETERS.glovesPct.toString())

    maskPct.onchange = (val) => {
      DEFAULT_INTERVENTION_PARAMETERS.maskPct = parseInt(val.target.value)
    }
    maskPct.setAttribute('value', DEFAULT_INTERVENTION_PARAMETERS.maskPct.toString())

    // gownPct.onchange = (val) => {
    //   DEFAULT_INTERVENTION_PARAMETERS.gownPct = parseInt(val.target.value)
    // }
    // gownPct.setAttribute('value', DEFAULT_INTERVENTION_PARAMETERS.gownPct.toString())

    emergencyLockdown.onclick = () => {
      DEFAULT_INTERVENTION_PARAMETERS.emergencyLockdown = emergencyLockdown.checked
    }

    handwashPct.onchange = (val) => {
      DEFAULT_INTERVENTION_PARAMETERS.handwashPct = parseInt(val.target.value)
    }
    handwashPct.setAttribute('value', DEFAULT_INTERVENTION_PARAMETERS.handwashPct.toString())

    socialDistancePct.onchange = (val) => {
      DEFAULT_INTERVENTION_PARAMETERS.socialDistancePct = parseInt(val.target.value)
    }
    socialDistancePct
      .setAttribute('value', DEFAULT_INTERVENTION_PARAMETERS.socialDistancePct.toString())

    n95Pct.onchange = (val) => {
      DEFAULT_INTERVENTION_PARAMETERS.n95Pct = parseInt(val.target.value)
    }
    n95Pct.setAttribute('value', DEFAULT_INTERVENTION_PARAMETERS.n95Pct.toString())

    testFrequency.onchange = (val) => {
      DEFAULT_INTERVENTION_PARAMETERS.testFrequency = parseInt(val.target.value)
    }
    testFrequency.setAttribute('value', DEFAULT_INTERVENTION_PARAMETERS.testFrequency.toString())

    testPct.onchange = (val) => {
      DEFAULT_INTERVENTION_PARAMETERS.testPct = parseInt(val.target.value)
    }
    testPct.setAttribute('value', DEFAULT_INTERVENTION_PARAMETERS.testPct.toString())
  }

  sketch.draw = () => {
    sketch.background('white')
    balls.forEach(ball => {
      ball.checkState()
      ball.maybeTest()
      ball.checkCollisions({ others: balls })
      ball.move()
      ball.render()
    })
    updateCount()
  }
}, document.getElementById('canvas'))
