const DEFAULT_FILTERS = {
  death: false,
  stayHome: false
}

export const DEFAULT_INTERVENTION_PARAMETERS = {
  baselineR0: 8,
  handwashPct: 50,
  glovesPct: 50,
  maskPct: 50,
  n95Pct: 50,
  gownPct: 50,
  testFrequency: 30,
  testPct: 0
}

export const CANVAS_SIZE = {
  height: 880,
  width: 360
}

export const DESKTOP_CANVAS_SIZE = {
  height: 400,
  width: 800
}

export const BALL_RADIUS = 6
export const BADGE_RADIUS = 3
export const COLORS = {
  death: '#e41a1c',
  recovered: '#4daf4a',
  infected: '#e41a1c',
  well: '#377eb8',
  quarantined: '#ff7f00'
}

export const STATES = {
  infected: 'infected',
  well: 'well',
  recovered: 'recovered',
  quarantined: 'quarantined'
}

export const INTERVENTION_BADGES = ['handwash', 'gown', 'mask', 'n95', 'gloves']
export const BADGE_COLORS = [
  '#66c2a5',
  '#fc8d62',
  '#8da0cb',
  '#e78ac3',
  '#a6d854',
  '#ffd92f'
]

export const COUNTERS = {
  ...STATES,
  'max-concurrent-infected': 'max-concurrent-infected',
  'work-days-lost': 'work-days-lost',
  'work-days-performed': 'work-days-performed'
}

export const STARTING_BALLS = {
  [STATES.infected]: 1,
  [STATES.well]: 199,
  [STATES.recovered]: 0,
  [STATES.death]: 0,
  [STATES.quarantined]: 0,
  'max-concurrent-infected': 0
}

export const RUN = {
  filters: { ...DEFAULT_FILTERS },
  results: { ...STARTING_BALLS },
  interventionParameters: { ...DEFAULT_INTERVENTION_PARAMETERS },
  tick: 0
}

export const MORTALITY_PERCENTATGE = 5
export const SPEED = 2
export const TOTAL_TICKS = 10000
export const TICKS_TO_RECOVER = 500
export const TICKS_PER_DAY = 25 // Gives 20 days to recover
export const STATIC_PEOPLE_PERCENTATGE = 25

export const HANDWASHING_EFFECTIVENESS = 0.55
export const MASK_EFFECTIVENESS = 0.68
export const N95_MASK_EFFECTIVENESS = 0.95
export const GLOVE_EFFECTIVENESS = 0.57
export const GOWN_EFFECTIVENESS = 0.77
export const HAND_MASK_GOWN_EFFECTIVENESS = 0.91

function getBaselineTransmissionProbability () {
  // In the original WaPo graphic, every collision resulted in a transmission.
  // As a result, R0 is really enormous and interventions need to be extremely
  // effective in order to reduce transmission.
  //
  // We want to calibrate the probability that a collision leads to transmission
  // so that the expected number of infections due to the first ball is equal to
  // the R0 for covid-19, which is usually estimated as around 2.5.
  //
  // Units of distance are px, velocity is px/s

  // units: px
  const diameter = 2 * BALL_RADIUS

  // units: balls
  const nBalls = STARTING_BALLS.infected + STARTING_BALLS.well

  // units: px^2
  const volume = DESKTOP_CANVAS_SIZE.width * DESKTOP_CANVAS_SIZE.height

  // units: balls / px ^ 2
  const ballDensity = nBalls / volume

  // units: px / tick
  const meanRelVelocity = Math.SQRT2 * SPEED

  // How frequently will balls collide?
  // Note, this collision frequency estimate is different from the one in 3d
  // because the ball sweeps out a volume of dvt, not pi d^2 vt.
  //
  // units : balls / tick
  const collisionFrequency = diameter * meanRelVelocity * ballDensity

  // What is the total number of collisions that will occur during
  // an infection?
  //
  // units: balls
  const nCollisionsWhileInfected = TICKS_TO_RECOVER * collisionFrequency

  // Which probability of transmission would cause the expected number
  // of secondary infections to equal the desired R0?
  //
  // unitless
  const baselineTransmissionProbability =
    DEFAULT_INTERVENTION_PARAMETERS.baselineR0 / nCollisionsWhileInfected
  if (baselineTransmissionProbability > 1) {
    throw Error(
      'Need more balls to simulate such a high R0. Max R0 is ' +
        nCollisionsWhileInfected
    )
  }
  return baselineTransmissionProbability
}

DEFAULT_INTERVENTION_PARAMETERS.baselineTransmissionProbability = getBaselineTransmissionProbability()

export const resetRun = () => {
  RUN.results = { ...STARTING_BALLS }
  RUN.tick = 0

  DEFAULT_INTERVENTION_PARAMETERS.baselineTransmissionProbability = getBaselineTransmissionProbability()
}
