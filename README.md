# COVID-19 (Coronavirus) spread simulator 🦠

Check simulations about how confinement people could help to stop spreading Coronavirus.

[Based on Washington Post Article: Why outbreaks like coronavirus spread exponentially, and how to “flatten the curve” - Washington Post](https://www.washingtonpost.com/graphics/2020/world/corona-simulator/)

## How to start

Install all the project dependencies with:
```
npm install
```

And start the development server with:
```
npm run dev
```

## Browser support

This project is using EcmaScript Modules, therefore, only browsers with this compatibility will work. (Sorry Internet Explorer 11 and old Edge users).

## Update: Physical interventions

Collisions between infected and susceptible individuals now result in transmission with probability calibrated so that the expected number of transmissions during the infectious period is equal to the desired R0.

Estimates for efficacy of five physical interventions; gloves, handwashing >=10x per day, masks, n95 masks, and gowns; were taken from this review paper: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2190272/. These estimates were made for respiratory virus infections other than sars-cov-2 in 2008. They should be taken as imprecise even in that context, as efficacy estimates varied widely between constituent studies.

The paper did not consider interactions between multiple concurrent interventions, except the combination of handwashing, gloves, masks and gowns. This combination is handled as a special case in the code. Furthermore, handwashing and gloves are assumed to be redundant, and n95 masks are (reasonably) assumed to supersede regular masks when both are used. Otherwise, the effects of multiple interventions are assumed to be independent. This probably results in an overestimate of the effectiveness of combinations of multiple interventions.

## Update: Regular testing + self-quarantine

Users can choose to test a given fraction of the population, selected at random, at a given interval. A 'day' is defined so that the infectious period lasts 20 days. Tests are modelled as having a zero false positive rate and zero false negative rate.

Individuals who test positive are quarantined for the remainder of the infectious period. Quarantine is modelled as being perfect, so that quarantined individuals cannot infect others.