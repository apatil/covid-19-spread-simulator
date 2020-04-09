import {
  BALL_RADIUS,
  MORTALITY_PERCENTATGE,
  TICKS_TO_RECOVER,
  RUN,
  SPEED,
  STATES,
  HANDWASHING_EFFECTIVENESS,
  MASK_EFFECTIVENESS,
  GOWN_EFFECTIVENESS,
  N95_MASK_EFFECTIVENESS,
  GLOVE_EFFECTIVENESS,
  HAND_MASK_GOWN_EFFECTIVENESS,
  DEFAULT_INTERVENTION_PARAMETERS,
  TICKS_PER_DAY,
  INTERVENTION_BADGES
} from './options.js'
import { checkCollision, calculateChangeDirection } from './collisions.js'

function isPrevented (ball) {
  let probabilityOfInfection =
    DEFAULT_INTERVENTION_PARAMETERS.baselineTransmissionProbability

  if (
    (ball.interventions.glove || ball.interventions.handwash) &&
    ball.interventions.mask &&
    ball.interventions.gown
  ) {
    probabilityOfInfection *= 1.0 - HAND_MASK_GOWN_EFFECTIVENESS
  } else {
    if (ball.interventions.handwash && !ball.interventions.glove) {
      probabilityOfInfection *= 1.0 - HANDWASHING_EFFECTIVENESS
    }
    if (ball.interventions.mask && !ball.interventions.n95) {
      probabilityOfInfection *= 1.0 - MASK_EFFECTIVENESS
    }
    if (ball.interventions.glove) {
      probabilityOfInfection *= 1.0 - GLOVE_EFFECTIVENESS
    }
    if (ball.interventions.n95) {
      probabilityOfInfection *= 1.0 - N95_MASK_EFFECTIVENESS
    }
    if (ball.interventions.gown) {
      probabilityOfInfection *= 1.0 - GOWN_EFFECTIVENESS
    }
  }

  const probabilityOfPrevention = 1.0 - probabilityOfInfection
  return ball.sketch.random(0, 1) < probabilityOfPrevention
}

export class Ball {
  constructor ({ x, y, id, state, sketch, hasMovement }) {
    this.x = x
    this.y = y
    this.vx = (sketch.random(-1, 1) * SPEED) / Math.SQRT2
    this.vy = (sketch.random(-1, 1) * SPEED) / Math.SQRT2
    this.sketch = sketch
    this.id = id
    this.state = state
    this.timeInfected = 0
    this.timeSinceTestDay = 0
    this.hasMovement = hasMovement
    this.hasCollision = true
    this.survivor = false
    this.quarantined = false
    this.essentialWorker =
      sketch.random(0, 1) < DEFAULT_INTERVENTION_PARAMETERS.essentialPct / 100

    this.interventions = {
      handwash:
        sketch.random(0, 1) < DEFAULT_INTERVENTION_PARAMETERS.handwashPct / 100,
      gown: sketch.random(0, 1) < DEFAULT_INTERVENTION_PARAMETERS.gownPct / 100,
      mask: sketch.random(0, 1) < DEFAULT_INTERVENTION_PARAMETERS.maskPct / 100,
      n95: sketch.random(0, 1) < DEFAULT_INTERVENTION_PARAMETERS.n95Pct / 100,
      gloves:
        sketch.random(0, 1) < DEFAULT_INTERVENTION_PARAMETERS.glovesPct / 100
    }
  }

  checkState () {
    if (this.state === STATES.infected) {
      if (
        RUN.filters.death &&
        !this.survivor &&
        this.timeInfected >= TICKS_TO_RECOVER / 2
      ) {
        this.survivor = this.sketch.random(100) >= MORTALITY_PERCENTATGE
        if (!this.survivor) {
          this.hasMovement = false
          this.state = STATES.death
          RUN.results[STATES.infected]--
          RUN.results[STATES.death]++
          return
        }
        if (this.quarantined) {
          this.hasMovement = false
        }
      }

      if (this.timeInfected >= TICKS_TO_RECOVER) {
        if (this.quarantined) {
          RUN.results[STATES.quarantined]--
        }
        this.quarantined = false
        this.hasMovement = true
        this.state = STATES.recovered
        RUN.results[STATES.infected]--
        RUN.results[STATES.recovered]++
      } else {
        this.timeInfected++
      }
    }
  }

  test () {
    if (this.state === STATES.infected && !this.quarantined) {
      this.quarantined = true
      this.hasMovement = false
      RUN.results[STATES.quarantined]++
    }
  }

  maybeTest () {
    const itsTestDay =
      this.timeSinceTestDay >
      DEFAULT_INTERVENTION_PARAMETERS.testFrequency * TICKS_PER_DAY
    if (itsTestDay) {
      this.timeSinceTestDay = 0
      if (
        this.sketch.random(0, 1) <
        DEFAULT_INTERVENTION_PARAMETERS.testPct / 100
      ) {
        this.test()
      }
    } else {
      this.timeSinceTestDay++
    }
  }

  checkCollisions ({ others }) {
    if (this.state === STATES.death) return

    for (let i = this.id + 1; i < others.length; i++) {
      const otherBall = others[i]
      const { state, x, y } = otherBall
      if (state === STATES.death) continue

      const dx = x - this.x
      const dy = y - this.y

      let sociallyDistanced = false
      let diameter = BALL_RADIUS * 2
      if (
        this.sketch.random(0, 1) <
        DEFAULT_INTERVENTION_PARAMETERS.socialDistancePct / 100
      ) {
        diameter = BALL_RADIUS * 2.2
        sociallyDistanced = true
      }

      if (checkCollision({ dx, dy, diameter: diameter })) {
        const { ax, ay } = calculateChangeDirection({
          dx,
          dy,
          scale: sociallyDistanced + 1
        })
        this.vx -= ax
        this.vy -= ay
        otherBall.vx = ax
        otherBall.vy = ay

        // both has same state, so nothing to do
        if (this.state === state) return
        // if any is recovered, then nothing happens
        if (this.state === STATES.recovered || state === STATES.recovered) {
          return
        }
        // then, if some is infected, then we make both infected
        // unless prevented by an intervention
        if (
          this.state === STATES.infected &&
          !this.quarantined &&
          otherBall.state === STATES.well &&
          !isPrevented(otherBall) &&
          !sociallyDistanced
        ) {
          otherBall.state = STATES.infected
          RUN.results[STATES.infected]++
          RUN.results[STATES.well]--
        }

        if (
          otherBall.state === STATES.infected &&
          !otherBall.quarantined &&
          this.state === STATES.well &&
          !isPrevented(this) &&
          !sociallyDistanced
        ) {
          this.state = STATES.infected
          RUN.results[STATES.infected]++
          RUN.results[STATES.well]--
        }
      }
    }
  }

  move () {
    if (!this.hasMovement) return
    if (
      DEFAULT_INTERVENTION_PARAMETERS.emergencyLockdown &&
      !this.essentialWorker
    ) { return }

    this.x += this.vx
    this.y += this.vy

    // check horizontal walls
    if (
      (this.x + BALL_RADIUS > this.sketch.width && this.vx > 0) ||
      (this.x - BALL_RADIUS < 0 && this.vx < 0)
    ) {
      this.vx *= -1
    }

    // check vertical walls
    if (
      (this.y + BALL_RADIUS > this.sketch.height && this.vy > 0) ||
      (this.y - BALL_RADIUS < 0 && this.vy < 0)
    ) {
      this.vy *= -1
    }
  }

  render () {
    // let color
    // if (this.quarantined) {
    //   color = COLORS.quarantined
    // } else {
    //   color = COLORS[this.state]
    // }
    // this.sketch.noStroke()
    // this.sketch.fill(color)
    let name = this.state
    if (this.quarantined) {
      name = 'quarantined'
    }
    for (let i = 0; i < INTERVENTION_BADGES.length; i++) {
      const interventionCheck = INTERVENTION_BADGES[i]
      if (this.interventions[interventionCheck]) {
        name += '-' + interventionCheck
      }
    }
    const sprite = this.sketch.sprite_lookup[name]
    const [sx, sy, sw, sh] = sprite
    this.sketch.drawingContext.drawImage(
      this.sketch.sprite,
      sx,
      sy,
      sw,
      sh,
      this.x - sw / 2,
      this.y - sh / 2,
      sw,
      sh
    )
    // this.sketch.circle(this.x, this.y, adj_diameter)
  }
}
