import 'dotenv/config'
import { select } from '@inquirer/prompts'

const script = './script'

const run = async () => {
    const choices = [
        {
            name: 'Populate account table',
            value: `${script}/populate.account.ts`,
        },
    ]

    const answer = await select({
        choices,
        message: 'Select a script to run:',
    })

    const fn = (await import(`./${answer}`)).default
    await fn()

    console.log('Done')
}

run()
