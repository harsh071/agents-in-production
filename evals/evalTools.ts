import type { Score, Scorer } from 'autoevals'
import chalk from 'chalk'
import { JSONFilePreset } from 'lowdb/node'

type Run = {
  input: any
  output: any
  expected: any
  scores: {
    name: Score['name']
    score: Score['score']
  }[]
  createdAt?: string
}

type Set = {
  runs: Run[]
  score: number
  createdAt: string
}

type Experiment = {
  name: string
  sets: Set[]
}

type Data = {
  experiments: Experiment[]
}

const defaultData: Data = {
  experiments: [],
}

const getDb = async () => {
  const db = await JSONFilePreset<Data>('results.json', defaultData)
  return db
}

const calculateAvgScore = (runs: Run[]) => {
  const totalScores = runs.reduce((sum, run) => {
    const runAvg =
      run.scores.reduce((sum, score) => sum + score.score, 0) /
      run.scores.length
    return sum + runAvg
  }, 0)
  return totalScores / runs.length
}

export const loadExperiment = async (
  experimentName: string
): Promise<Experiment | undefined> => {
  const db = await getDb()
  return db.data.experiments.find((e) => e.name === experimentName)
}

export const saveSet = async (
  experimentName: string,
  runs: Omit<Run, 'createdAt'>[]
) => {
  const db = await getDb()

  const runsWithTimestamp = runs.map((run) => ({
    ...run,
    createdAt: new Date().toISOString(),
  }))

  const newSet = {
    runs: runsWithTimestamp,
    score: calculateAvgScore(runsWithTimestamp),
    createdAt: new Date().toISOString(),
  }

  const existingExperiment = db.data.experiments.find(
    (e) => e.name === experimentName
  )

  if (existingExperiment) {
    existingExperiment.sets.push(newSet)
  } else {
    db.data.experiments.push({
      name: experimentName,
      sets: [newSet],
    })
  }

  await db.write()
}

export const runEval = async <T = any>(
  experiment: string,
  {
    task,
    data,
    scorers,
  }: {
    task: (input: any) => Promise<T>
    data: { input: any; expected: T }[]
    scorers: Scorer<T, any>[]
  }
) => {
  const results = await Promise.all(
    data.map(async ({ input, expected }) => {
      const output = await task(input)

      const scores = await Promise.all(
        scorers.map(async (scorer) => {
          const score = await scorer({ input, output, expected })
          return {
            name: score.name,
            score: score.score,
          }
        })
      )

      const result = {
        input,
        output,
        expected,
        scores,
      }

      return result
    })
  )

  const previousExperiment = await loadExperiment(experiment)
  const previousScore =
    previousExperiment?.sets[previousExperiment.sets.length - 1]?.score || 0
  const currentScore = calculateAvgScore(results)
  const scoreDiff = currentScore - previousScore

  const color = previousExperiment
    ? scoreDiff > 0
      ? chalk.green
      : scoreDiff < 0
      ? chalk.red
      : chalk.blue
    : chalk.blue

  console.log(`Previous score: ${color(previousScore.toFixed(2))}`)
  console.log(`Current score: ${color(currentScore.toFixed(2))}`)
  console.log(
    `Difference: ${scoreDiff > 0 ? '+' : ''}${color(scoreDiff.toFixed(2))}`
  )

  await saveSet(experiment, results)

  return results
}
